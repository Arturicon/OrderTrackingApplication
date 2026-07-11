using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

public class OrderHub : Hub
{
    private readonly ILogger<OrderHub> _logger;

    public OrderHub(ILogger<OrderHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation($"Client connected: {Context.ConnectionId}");
        //_logger.LogInformation($"Transport: {Context.Features.Get<Microsoft.AspNetCore.Http.Features.IHttpConnectionFeature>()?.Transport}");

        await Clients.Caller.SendAsync("Connected", new
        {
            ConnectionId = Context.ConnectionId,
            //Transport = Context.Features.Get<Microsoft.AspNetCore.Http.Features.IHttpConnectionFeature>()?.Transport
        });

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation($"Client disconnected: {Context.ConnectionId}");
        await base.OnDisconnectedAsync(exception);
    }

    // Подписка на обновления заказов
    public async Task SubscribeToOrder(string orderId)
    {
        _logger.LogInformation($"Client {Context.ConnectionId} subscribed to order {orderId}");
        await Groups.AddToGroupAsync(Context.ConnectionId, $"order_{orderId}");
        await Clients.Caller.SendAsync("Subscribed", new { OrderId = orderId, Success = true });
    }

    // Отписка от обновлений заказа
    public async Task UnsubscribeFromOrder(string orderId)
    {
        _logger.LogInformation($"Client {Context.ConnectionId} unsubscribed from order {orderId}");
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"order_{orderId}");
        await Clients.Caller.SendAsync("Unsubscribed", new { OrderId = orderId, Success = true });
    }

    // Получение статуса заказа
    public async Task GetOrderStatus(string orderId)
    {
        // Эмуляция получения статуса
        var status = new
        {
            OrderId = orderId,
            Status = "shipped",
            UpdatedAt = DateTime.UtcNow
        };

        await Clients.Caller.SendAsync("OrderStatus", status);
    }

    // Обновление статуса заказа (только для демонстрации)
    public async Task UpdateOrderStatus(string orderId, string status)
    {
        _logger.LogInformation($"Order {orderId} status updated to {status}");

        // Эмуляция обновления
        var updatedOrder = new
        {
            OrderId = orderId,
            Status = status,
            UpdatedAt = DateTime.UtcNow
        };

        // Отправляем обновление всем подписанным клиентам
        await Clients.Group($"order_{orderId}").SendAsync("StatusUpdated", updatedOrder);

        // Отправляем подтверждение отправителю
        await Clients.Caller.SendAsync("StatusUpdateConfirmed", new { Success = true, OrderId = orderId });
    }

    // Создание нового заказа
    public async Task CreateOrder(object orderData)
    {
        _logger.LogInformation($"New order created: {orderData}");

        // Эмуляция создания заказа
        var newOrder = new
        {
            Id = Guid.NewGuid().ToString(),
            OrderNumber = $"ORD-{DateTime.UtcNow:yyyyMMdd}-{new Random().Next(1000, 9999)}",
            Description = ((dynamic)orderData).Description,
            Status = "created",
            CreatedAt = DateTime.UtcNow
        };

        // Отправляем всем клиентам
        await Clients.All.SendAsync("OrderCreated", newOrder);
    }

    // Удаление заказа
    public async Task DeleteOrder(string orderId)
    {
        _logger.LogInformation($"Order {orderId} deleted");

        await Clients.All.SendAsync("OrderDeleted", new { OrderId = orderId, DeletedAt = DateTime.UtcNow });
    }

    // Проверка соединения
    public async Task Ping()
    {
        await Clients.Caller.SendAsync("Pong", DateTime.UtcNow);
    }
}