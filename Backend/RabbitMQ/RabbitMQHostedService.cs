using Backend.Domain.Interfeces;

/// <summary>
/// Фоновый сервис для управления подключением к RabbitMQ при запуске и остановке приложения.
/// </summary>
public class RabbitMQHostedService : IHostedService
{
    private readonly IEventPublisher _publisher;
    private readonly ILogger<RabbitMQHostedService> _logger;
    private readonly IConfiguration _configuration;

    /// <summary>
    /// Инициализирует новый экземпляр сервиса.
    /// </summary>
    /// <param name="publisher">Публикатор событий RabbitMQ.</param>
    /// <param name="logger">Сервис логирования.</param>
    /// <param name="configuration">Конфигурация приложения.</param>
    public RabbitMQHostedService(
        IEventPublisher publisher,
        ILogger<RabbitMQHostedService> logger,
        IConfiguration configuration)
    {
        _publisher = publisher;
        _logger = logger;
        _configuration = configuration;
    }

    /// <summary>
    /// Запускает сервис и устанавливает соединение с RabbitMQ.
    /// </summary>
    /// <param name="cancellationToken">Токен отмены.</param>
    public async Task StartAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("RabbitMQ hosted service starting...");
        await _publisher.SetConnection(_configuration);
    }

    /// <summary>
    /// Останавливает сервис и освобождает ресурсы RabbitMQ.
    /// </summary>
    /// <param name="cancellationToken">Токен отмены.</param>
    public async Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("RabbitMQ hosted service stopping...");
        ((IAsyncDisposable)_publisher)?.DisposeAsync();
        await Task.CompletedTask;
    }
}