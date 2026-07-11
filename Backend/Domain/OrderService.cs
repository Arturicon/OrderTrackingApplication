using Backend.Domain.Entities;


namespace Backend.Domain;
public class OrderService : IOrderService
{
    private readonly IOrderRepository _orderRepository;
    private readonly IEventPublisher _eventPublisher;
    private readonly ILogger<OrderService> _logger;

    public OrderService(
        IOrderRepository orderRepository,
        IEventPublisher eventPublisher,
        ILogger<OrderService> logger)
    {
        _orderRepository = orderRepository;
        _eventPublisher = eventPublisher;
        _logger = logger;
    }

    public async Task<Order> CreateOrderAsync(string description)
    {
        _logger.LogInformation("Creating new order with description: {Description}", description);

        if (string.IsNullOrWhiteSpace(description))
            throw new ArgumentException("Description is required");

        var orderNumber = GenerateOrderNumber();
        var order = new Order(orderNumber, description);

        var createdOrder = await _orderRepository.AddAsync(order);

        _logger.LogInformation("Order created successfully with ID: {OrderId}, Number: {OrderNumber}",
            createdOrder.Id, createdOrder.OrderNumber);

        return createdOrder;
    }

    public async Task<Order> UpdateOrderStatusAsync(Guid orderId, OrderStatus newStatus)
    {
        _logger.LogInformation("Updating order status for Order ID: {OrderId} to {NewStatus}",
            orderId, newStatus);

        var order = await _orderRepository.GetByIdAsync(orderId);
        if (order == null)
        {
            _logger.LogWarning("Order with ID {OrderId} not found", orderId);
            throw new KeyNotFoundException($"Order with ID {orderId} not found");
        }

        var oldStatus = order.Status;
        order.UpdateStatus(newStatus);
        var updatedOrder = await _orderRepository.UpdateAsync(order);

        // Публикация события в RabbitMQ
        await _eventPublisher.PublishOrderStatusChangedEventAsync(order, oldStatus);

        _logger.LogInformation("Order status updated successfully for Order ID: {OrderId}. Old status: {OldStatus}, New status: {NewStatus}",
            updatedOrder.Id, oldStatus, updatedOrder.Status);

        return updatedOrder;
    }

    public async Task<Order> UpdateOrderDescriptionAsync(Guid orderId, string description)
    {
        _logger.LogInformation("Updating order description for Order ID: {OrderId}", orderId);

        if (string.IsNullOrWhiteSpace(description))
            throw new ArgumentException("Description is required");

        var order = await _orderRepository.GetByIdAsync(orderId);
        if (order == null)
        {
            _logger.LogWarning("Order with ID {OrderId} not found", orderId);
            throw new KeyNotFoundException($"Order with ID {orderId} not found");
        }

        order.UpdateDescription(description);
        var updatedOrder = await _orderRepository.UpdateAsync(order);

        _logger.LogInformation("Order description updated successfully for Order ID: {OrderId}", updatedOrder.Id);

        return updatedOrder;
    }

    public async Task DeleteOrderAsync(Guid orderId)
    {
        _logger.LogInformation("Deleting order with ID: {OrderId}", orderId);

        var exists = await _orderRepository.ExistsAsync(orderId);
        if (!exists)
        {
            _logger.LogWarning("Order with ID {OrderId} not found", orderId);
            throw new KeyNotFoundException($"Order with ID {orderId} not found");
        }

        await _orderRepository.DeleteAsync(orderId);
        _logger.LogInformation("Order deleted successfully with ID: {OrderId}", orderId);
    }

    public async Task<Order> GetOrderByIdAsync(Guid orderId)
    {
        _logger.LogInformation("Getting order with ID: {OrderId}", orderId);

        var order = await _orderRepository.GetByIdAsync(orderId);
        if (order == null)
        {
            _logger.LogWarning("Order with ID {OrderId} not found", orderId);
            throw new KeyNotFoundException($"Order with ID {orderId} not found");
        }

        return order;
    }

    public async Task<Order> GetOrderByNumberAsync(string orderNumber)
    {
        _logger.LogInformation("Getting order with number: {OrderNumber}", orderNumber);

        var order = await _orderRepository.GetByOrderNumberAsync(orderNumber);
        if (order == null)
        {
            _logger.LogWarning("Order with number {OrderNumber} not found", orderNumber);
            throw new KeyNotFoundException($"Order with number {orderNumber} not found");
        }

        return order;
    }

    public async Task<IEnumerable<Order>> GetAllOrdersAsync(OrderStatus? status = null)
    {
        _logger.LogInformation("Getting all orders");

        if (status.HasValue)
        {
            _logger.LogInformation("Filtering orders by status: {Status}", status.Value);
            return await _orderRepository.GetByStatusAsync(status.Value);
        }

        return await _orderRepository.GetAllAsync();
    }

    private string GenerateOrderNumber()
    {
        var timestamp = DateTime.UtcNow.ToString("yyyyMMdd");
        var random = new Random();
        var sequence = random.Next(1000, 9999).ToString();
        return $"ORD-{timestamp}-{sequence}";
    }
}
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



