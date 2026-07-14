using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Client;

namespace NotifyService;

public class OrderStatusChangedEvent
{
    public string OrderId { get; set; } = string.Empty;
    public string OrderNumber { get; set; } = string.Empty;
    public string OldStatus { get; set; } = string.Empty;
    public string NewStatus { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}
public interface IEventProcessor
{
    Task ProcessAsync(OrderStatusChangedEvent eventData, CancellationToken cancellationToken = default);
}

public class SignalREventProcessor : IEventProcessor
{
    private readonly ILogger<SignalREventProcessor> _logger;
    private readonly IHubContext<OrderHub> _hubContext;

    public SignalREventProcessor(
        ILogger<SignalREventProcessor> logger,
        IHubContext<OrderHub> hubContext)  
    {
        _logger = logger;
        _hubContext = hubContext;
    }

    public async Task ProcessAsync(OrderStatusChangedEvent eventData, CancellationToken cancellationToken = default)
    {
        try
        {
            // ✅ Отправляем уведомление в группу заказа через IHubContext
            await _hubContext.Clients
                .All
                //.Group($"order_{eventData.OrderId}")  // ← Группа для конкретного заказа
                .SendAsync(
                    "OrderStatusChanged",             // ← Имя метода на клиенте
                    new
                    {
                        OrderId = eventData.OrderId,
                        OrderNumber = eventData.OrderNumber,
                        OldStatus = eventData.OldStatus,
                        NewStatus = eventData.NewStatus,
                        Timestamp = eventData.Timestamp
                    },
                    cancellationToken);

            _logger.LogInformation(
                "Notification sent via SignalR to group 'order_{OrderId}': {OldStatus} -> {NewStatus}",
                eventData.OrderId,
                eventData.OldStatus,
                eventData.NewStatus);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send notification for order {OrderId}", eventData.OrderId);
            throw;
        }
    }
}