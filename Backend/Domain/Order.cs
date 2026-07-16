using System.Collections.Generic;
using System.Reflection.Emit;


namespace Backend.Domain.Entities;

public class Order
{
    public Guid Id { get; private set; }
    public string OrderNumber { get; private set; }
    public string Description { get; private set; }
    public OrderStatus Status { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime? UpdatedAt { get; private set; }

    public Order(string orderNumber, string description)
    {
        Id = Guid.NewGuid();
        OrderNumber = orderNumber;
        Description = description;
        Status = OrderStatus.created;
        CreatedAt = DateTime.UtcNow;
    }
    public Order(Guid id, string orderNumber, string description)
    {
        Id = id;
        OrderNumber = orderNumber;
        Description = description;
        Status = OrderStatus.created;
        CreatedAt = DateTime.UtcNow;
    }

    public void UpdateStatus(OrderStatus newStatus)
    {
        if (Status == newStatus)
            return;

        Status = newStatus;
        UpdatedAt = DateTime.UtcNow;
    }

    public void UpdateDescription(string newDescription)
    {
        Description = newDescription;
        UpdatedAt = DateTime.UtcNow;
    }
}

public enum OrderStatus
{
    created = 0,
    shipped = 1,
    delivered = 2,
    cancelled = 3
}
