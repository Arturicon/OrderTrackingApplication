namespace Backend.Domain.Interfeces;

public interface IEventPublisher
{
    Task PublishOrderStatusChangedEventAsync(Order order, OrderStatus oldStatus);
    Task SetConnection(IConfiguration configuration);
}
