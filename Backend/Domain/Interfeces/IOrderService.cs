namespace Backend.Domain.Interfeces;

public interface IOrderService
{
    Task<Order> CreateOrderAsync(string description);
    Task<Order> UpdateOrderStatusAsync(Guid orderId, OrderStatus newStatus);
    Task<Order> UpdateOrderDescriptionAsync(Guid orderId, string description);
    Task DeleteOrderAsync(Guid orderId);
    Task<Order> GetOrderByIdAsync(Guid orderId);
    Task<Order> GetOrderByNumberAsync(string orderNumber);
    Task<IEnumerable<Order>> GetAllOrdersAsync(OrderStatus? status = null);
}



