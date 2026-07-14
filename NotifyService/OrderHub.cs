using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;

namespace NotifyService;

public class OrderHub : Hub
{
    private readonly ILogger<OrderHub> _logger;

    public OrderHub(ILogger<OrderHub> logger)
    {
        _logger = logger;
    }

    public async Task SubscribeToOrder(string orderId)
    {
        try
        {
            // Добавляем клиента в группу заказа
            await Groups.AddToGroupAsync(Context.ConnectionId, $"order_{orderId}");

            _logger.LogInformation(
                "Client {ConnectionId} subscribed to order {OrderId}",
                Context.ConnectionId,
                orderId);

            // Подтверждаем подписку
            await Clients.Caller.SendAsync("SubscriptionConfirmed", new
            {
                OrderId = orderId,
                Success = true,
                Message = "Successfully subscribed to order updates"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error subscribing client {ConnectionId} to order {OrderId}",
                Context.ConnectionId, orderId);
            throw;
        }
    }

    public async Task UnsubscribeFromOrder(string orderId)
    {
        try
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"order_{orderId}");

            _logger.LogInformation(
                "Client {ConnectionId} unsubscribed from order {OrderId}",
                Context.ConnectionId,
                orderId);

            await Clients.Caller.SendAsync("UnsubscriptionConfirmed", new
            {
                OrderId = orderId,
                Success = true,
                Message = "Successfully unsubscribed from order updates"
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error unsubscribing client {ConnectionId} from order {OrderId}",
                Context.ConnectionId, orderId);
            throw;
        }
    }


    public override async Task OnConnectedAsync()
    {
        _logger.LogInformation("Client {ConnectionId} connected", Context.ConnectionId);
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        _logger.LogInformation("Client {ConnectionId} disconnected", Context.ConnectionId);
        await base.OnDisconnectedAsync(exception);
    }
}