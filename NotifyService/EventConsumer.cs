using Microsoft.AspNetCore.Mvc.Diagnostics;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;
using System.Text.Json;
using System.Threading.Channels;

namespace NotifyService;


public class EventConsumer : BackgroundService
{
    private readonly IConfiguration _configuration;
    private readonly IEventProcessor _eventProcessor;
    private readonly ILogger<EventConsumer> _logger;
    private readonly string _queueName;

    public EventConsumer(IConfiguration configuration, IEventProcessor eventProcessor, ILogger<EventConsumer> logger)
    {
        _configuration = configuration;
        _eventProcessor = eventProcessor;
        _logger = logger;
        _queueName = _configuration["RabbitMQ:QueueName"] ?? "order_queue";
    }
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var channel = await InitializeAsync(stoppingToken);
        await StartConsumingAsync(channel, stoppingToken);
    }

    private async Task<IChannel> InitializeAsync(CancellationToken stoppingToken)
    {
        var exchangeName = _configuration["RabbitMQ:ExchangeName"] ?? "order_exchange";
        var routingKey = _configuration["RabbitMQ:RoutingKey"] ?? "order.status.changed";
        var hostName = _configuration["RabbitMQ:HostName"] ?? "localhost";
        var port = int.Parse(_configuration["RabbitMQ:Port"] ?? "5672");

        var factory = new ConnectionFactory
        {
            HostName = hostName,
            Port = port,
            AutomaticRecoveryEnabled = true,
            NetworkRecoveryInterval = TimeSpan.FromSeconds(10),
            RequestedHeartbeat = TimeSpan.FromSeconds(30),
        };
        var connection = await factory.CreateConnectionAsync(stoppingToken);
        var channel = await connection.CreateChannelAsync();
        try
        {

            await channel.ExchangeDeclareAsync(
        exchange: exchangeName,
        type: ExchangeType.Direct,
        durable: true,
        autoDelete: false);
            await channel.QueueDeclareAsync(
                queue: _queueName,
                durable: true,
                exclusive: false,
                autoDelete: false);

            // Bind queue to exchange
            await channel.QueueBindAsync(
                queue: _queueName,
                exchange: exchangeName,
                routingKey: routingKey);

            await StartConsumingAsync(channel, stoppingToken);
            return channel;
        }
        finally
        {
            await channel?.CloseAsync();
            await connection?.CloseAsync();
            channel?.Dispose();
            connection?.Dispose();
        }
    }

    private async Task StartConsumingAsync(IChannel channel, CancellationToken stoppingToken)
    {
        var consumer = new AsyncEventingBasicConsumer(channel);
        consumer.ReceivedAsync += async (m, ea) => {
            try { 
            var body = ea.Body.ToArray();
            var message = Encoding.UTF8.GetString(body);
            using var ms = new MemoryStream(body);
            var statusEvent = await JsonSerializer.DeserializeAsync<OrderStatusChangedEvent>(ms);
            if (statusEvent != null)
            {
                await _eventProcessor.ProcessAsync(statusEvent, stoppingToken);
                _logger.LogInformation("Processed order status change: {OrderId}", statusEvent.OrderId);
            }
            var routingKey = ea.RoutingKey;
            Console.WriteLine($" [x] Received '{routingKey}':'{message}'");
            await channel.BasicAckAsync(ea.DeliveryTag, false);
        }
        catch
        {
            await channel.BasicNackAsync(ea.DeliveryTag, false, true);
        }
    };

        await channel.BasicConsumeAsync(_queueName, autoAck: false, consumer: consumer);
        await Task.Delay(Timeout.Infinite, stoppingToken);
    }



}


