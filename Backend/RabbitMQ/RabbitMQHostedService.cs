using Backend.Domain.Interfeces;

namespace Backend.RabbitMQ;

public class RabbitMQHostedService : IHostedService
{
    private readonly IEventPublisher _publisher;
    private readonly ILogger<RabbitMQHostedService> _logger;
    private readonly IConfiguration _configuration;

    public RabbitMQHostedService(
        IEventPublisher publisher,
        ILogger<RabbitMQHostedService> logger,
        IConfiguration configuration)
    {
        _publisher = publisher;
        _logger = logger;
        _configuration = configuration;
    }

    public async Task StartAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("RabbitMQ hosted service starting...");
        await _publisher.SetConnection(_configuration); 
    }

    public async Task StopAsync(CancellationToken cancellationToken)
    {
        _logger.LogInformation("RabbitMQ hosted service stopping...");
        ((IAsyncDisposable)_publisher)?.DisposeAsync();
        await Task.CompletedTask;
    }
}

