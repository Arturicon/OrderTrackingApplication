using Backend.Domain;
using Backend.Domain.Interfeces;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;
using System.Text;
using System.Text.Json;
using System.Threading.Channels;

namespace Backend.RabbitMQ;

/// <summary>
/// Публикатор событий в RabbitMQ.
/// </summary>
public class RabbitMQEventPublisher : IEventPublisher, IAsyncDisposable
{
    private IConnection _connection;
    private IChannel _channel;
    private readonly string _exchangeName;
    private readonly string _routingKey;
    private readonly string _hostName;
    private readonly string _stuckQueue = "stuck_messages_queue";
    private readonly int _port;
    private readonly ILogger<RabbitMQEventPublisher> _logger;
    private readonly SemaphoreSlim _semaphoreSlim = new(1, 1);

    /// <summary>
    /// Инициализирует новый экземпляр публикатора.
    /// </summary>
    /// <param name="configuration">Конфигурация RabbitMQ.</param>
    /// <param name="logger">Сервис логирования.</param>
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

    /// <summary>
    /// Устанавливает соединение с RabbitMQ.
    /// </summary>
    /// <param name="configuration">Конфигурация RabbitMQ.</param>
    /// <exception cref="Exception">Выбрасывается при ошибке подключения.</exception>
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
            var channelOpts = new CreateChannelOptions(
    publisherConfirmationsEnabled: true,
    publisherConfirmationTrackingEnabled: true);
            _channel = await _connection.CreateChannelAsync(channelOpts);

            _channel.BasicAcksAsync += BasicAcksAsyncHandler;
            _channel.BasicNacksAsync += BasicNacksAsyncHandler;
            _channel.BasicReturnAsync += BasicReturnAsyncHandler;

            await _channel.ExchangeDeclareAsync(
                exchange: _exchangeName,
                type: ExchangeType.Direct,
                durable: true,
                autoDelete: false);

            var queueName = configuration["RabbitMQ:QueueName"] ?? "order_queue";
            var arguments = new Dictionary<string, object?>
{
    { "x-queue-type", "quorum" },
    { "x-dead-letter-exchange", "" }, // Пустая строка = default exchange
    { "x-dead-letter-routing-key", "dead_letter_queue" } // Куда отправлять
};
            await _channel.QueueDeclareAsync(
    queue: _stuckQueue,
    durable: true,
    exclusive: false,
    autoDelete: false
);
            await _channel.QueueDeclareAsync(
                queue: queueName,
                durable: true,
                exclusive: false,
                autoDelete: false,
                arguments: arguments);

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

    /// <summary>
    /// Публикует событие об изменении статуса заказа.
    /// </summary>
    /// <param name="order">Заказ.</param>
    /// <param name="oldStatus">Старый статус.</param>
    /// <exception cref="InvalidOperationException">Выбрасывается, если канал не открыт.</exception>
    public async Task PublishOrderStatusChangedEventAsync(Order order, OrderStatus oldStatus)
    {
        if (_channel == null || _channel.IsOpen == false)
        {
            throw new InvalidOperationException("RabbitMQ channel is not open");
        }
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
        try
        {
            var properties = new BasicProperties
            {
                Persistent = true,
                ContentType = "application/json",
                Timestamp = new AmqpTimestamp(DateTimeOffset.UtcNow.ToUnixTimeSeconds()),
                DeliveryMode = DeliveryModes.Persistent
            };
            //await _channel.BasicQosAsync(0, 10, false);
            await _channel.BasicPublishAsync(
                exchange: _exchangeName,
                routingKey: "3e3e3",
                mandatory: true,
                basicProperties: properties,
                body: body);

            _logger.LogInformation("Order status change event published for Order ID: {OrderId}, Old Status: {OldStatus}, New Status: {NewStatus}",
                order.Id, oldStatus, order.Status);

        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to publish order status change event for Order ID: {OrderId}", order.Id);
            await SaveToStuckQueueAsync(body, ex.Message);
            throw;
        }
    }
    private async Task SaveToStuckQueueAsync(byte[] body, string reason)
    {
        var stuckProps = new BasicProperties
        {
            Persistent = true,
            Headers = new Dictionary<string, object?>
            {
                { "x-return-reason", reason },
                { "x-return-time", DateTime.UtcNow.ToString("o") },
                { "x-error-type", "producer_return" }
            }
        };

        await _channel.BasicPublishAsync(
            exchange: "",
            routingKey: _stuckQueue,
            mandatory: false,
            basicProperties: stuckProps,
            body: body
        );
    }


    /// <summary>
    /// Освобождает ресурсы.
    /// </summary>
    public async ValueTask DisposeAsync()
    {
        if (_channel != null)
        {
            await _channel.CloseAsync();
            await _channel.DisposeAsync();
        }
        _logger.LogInformation("RabbitMQ connection disposed");
    }

    /// <summary>
    /// Обрабатывает возврат сообщения.
    /// </summary>
    private async Task BasicReturnAsyncHandler(object sender, BasicReturnEventArgs e)
    {
        var body = e.Body.ToArray();
        var message = Encoding.UTF8.GetString(body);
        _logger.LogWarning(
    "Message returned: Exchange={Exchange}, RoutingKey={RoutingKey}, ReplyText={ReplyText}, Body={Body}",
    e.Exchange, e.RoutingKey, e.ReplyText, message);
        await SaveToStuckQueueAsync(body, e.ReplyText);
    }

    /// <summary>
    /// Обрабатывает отрицательное подтверждение.
    /// </summary>
    private async Task BasicNacksAsyncHandler(object sender, BasicNackEventArgs e)
    {
        _logger.LogWarning($"Message NOT confirmed: DeliveryTag={e.DeliveryTag}, Multiple={e.Multiple}");
    }

    /// <summary>
    /// Обрабатывает положительное подтверждение.
    /// </summary>
    private async Task BasicAcksAsyncHandler(object sender, BasicAckEventArgs e)
    {
        _logger.LogDebug($"Message confirmed: DeliveryTag={e.DeliveryTag}, Multiple={e.Multiple}");
    }
}