namespace Backend.Domain.Interfeces;

public interface IOrderRepository
{
    Task<Order> GetByIdAsync(Guid id);
    Task<Order> GetByOrderNumberAsync(string orderNumber);
    Task<IEnumerable<Order>> GetAllAsync();
    Task<IEnumerable<Order>> GetByStatusAsync(OrderStatus status);
    Task<Order> AddAsync(Order order);
    Task<Order> UpdateAsync(Order order);
    Task DeleteAsync(Guid id);
    Task<bool> ExistsAsync(Guid id);
    Task<bool> OrderNumberExistsAsync(string orderNumber);
}
