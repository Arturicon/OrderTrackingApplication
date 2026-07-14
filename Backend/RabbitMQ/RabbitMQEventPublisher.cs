using Backend.Domain.Entities;
using Microsoft.EntityFrameworkCore.Metadata;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;
using System.Text.Json;

namespace Backend.RabbitMQ;

public class RabbitMQEventPublisher : IEventPublisher, IAsyncDisposable
{
    private IConnection _connection;
    private IChannel _channel;
    private readonly string _exchangeName;
    private readonly string _routingKey;
    private readonly string _hostName;
    private readonly int _port;
    private readonly ILogger<RabbitMQEventPublisher> _logger;
    private readonly SemaphoreSlim _semaphoreSlim = new(1,1);

    public RabbitMQEventPublisher(
        IConfiguration configuration,
        ILogger<RabbitMQEventPublisher> logger)
    {
        _logger = logger;
        _exchangeName = configuration["RabbitMQ:ExchangeName"] ?? "order_exchange";
        _routingKey = configuration["RabbitMQ:RoutingKey"] ?? "order.status.changed";
        _hostName = configuration["RabbitMQ:HostName"] ?? "localhost";
        _port = int.Parse(configuration["RabbitMQ:Port"] ?? "5672");
    }

    public async Task SetConnection(IConfiguration configuration)
    {
        await _semaphoreSlim.WaitAsync();
        try
        {
            var factory = new ConnectionFactory
            {
                HostName = _hostName,
                Port = _port,
                AutomaticRecoveryEnabled = true,
                NetworkRecoveryInterval = TimeSpan.FromSeconds(10),
                RequestedHeartbeat = TimeSpan.FromSeconds(30),
            };
            _connection = await factory.CreateConnectionAsync();
            _channel = await _connection.CreateChannelAsync();


            _channel.BasicAcksAsync += BasicAcksAsyncHandler;
            _channel.BasicNacksAsync += BasicNacksAsyncHandler;
            _channel.BasicReturnAsync += BasicReturnAsyncHandler;

            // Declare exchange
            await _channel.ExchangeDeclareAsync(
                exchange: _exchangeName,
                type: ExchangeType.Direct,
                durable: true,
                autoDelete: false);

            // Declare queue
            var queueName = configuration["RabbitMQ:QueueName"] ?? "order_queue";
            await _channel.QueueDeclareAsync(
                queue: queueName,
                durable: true,
                exclusive: false,
                autoDelete: false);

            // Bind queue to exchange
            await _channel.QueueBindAsync(
                queue: queueName,
                exchange: _exchangeName,
                routingKey: _routingKey);

            _logger.LogInformation("RabbitMQ connection established successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to connect to RabbitMQ");
            throw;
        }
        finally { _semaphoreSlim.Release(); }
    }



    public async Task PublishOrderStatusChangedEventAsync(Order order, OrderStatus oldStatus)
    {
        if (_channel == null || _channel.IsOpen == false)
        {
            throw new InvalidOperationException("RabbitMQ channel is not open");
        }
        try
        {
            var eventData = new
            {
                OrderId = order.Id,
                OrderNumber = order.OrderNumber,
                OldStatus = oldStatus.ToString(),
                NewStatus = order.Status.ToString(),
                Timestamp = DateTime.UtcNow
            };

            var message = JsonSerializer.Serialize(eventData);
            var body = Encoding.UTF8.GetBytes(message);

            var properties = new BasicProperties
            {
                Persistent = true, //чтобы сохранялось на диск
                ContentType = "application/json",
                Timestamp = new AmqpTimestamp(DateTimeOffset.UtcNow.ToUnixTimeSeconds()),
                DeliveryMode = DeliveryModes.Persistent
            };

            await _channel.BasicPublishAsync(
                exchange: _exchangeName,
                routingKey: _routingKey,
                mandatory: true,
                basicProperties: properties,
                body: body);

            _logger.LogInformation("Order status change event published for Order ID: {OrderId}, Old Status: {OldStatus}, New Status: {NewStatus}",
                order.Id, oldStatus, order.Status);

            await Task.CompletedTask;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to publish order status change event for Order ID: {OrderId}", order.Id);
            throw;
        }
    }



    public async ValueTask DisposeAsync()
    {
        if(_channel != null)
        {
            await _channel.CloseAsync();
            await _channel.DisposeAsync();
        }
        _logger.LogInformation("RabbitMQ connection disposed");
    }

    private async Task BasicReturnAsyncHandler(object sender, BasicReturnEventArgs e)
    {
        var message = Encoding.UTF8.GetString(e.Body.Span);
        _logger.LogWarning(
            "Message returned: Exchange={Exchange}, RoutingKey={RoutingKey}, ReplyText={ReplyText}, Body={Body}",
            e.Exchange, e.RoutingKey, e.ReplyText, message);
    }

    private async Task BasicNacksAsyncHandler(object sender, BasicNackEventArgs e)
    {
        _logger.LogWarning($"Message NOT confirmed: DeliveryTag={e.DeliveryTag}, Multiple={e.Multiple}");
    }

    private async Task BasicAcksAsyncHandler(object sender, BasicAckEventArgs e)
    {
        _logger.LogDebug($"Message confirmed: DeliveryTag={e.DeliveryTag}, Multiple={e.Multiple}");
    }

}

