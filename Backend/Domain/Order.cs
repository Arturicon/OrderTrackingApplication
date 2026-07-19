namespace Backend.Domain;

/// <summary>
/// Доменная сущность заказа.
/// </summary>
public class Order
{
    /// <summary>
    /// Уникальный идентификатор заказа.
    /// </summary>
    public Guid Id { get; private set; }

    /// <summary>
    /// Уникальный номер заказа.
    /// </summary>
    public string OrderNumber { get; private set; }

    /// <summary>
    /// Описание заказа.
    /// </summary>
    public string Description { get; private set; }

    /// <summary>
    /// Текущий статус заказа.
    /// </summary>
    public OrderStatus Status { get; private set; }

    /// <summary>
    /// Дата и время создания заказа (UTC).
    /// </summary>
    public DateTime CreatedAt { get; private set; }

    /// <summary>
    /// Дата и время последнего обновления заказа (UTC).
    /// </summary>
    public DateTime? UpdatedAt { get; private set; }

    /// <summary>
    /// Инициализирует новый заказ с автоматической генерацией идентификатора.
    /// </summary>
    /// <param name="orderNumber">Номер заказа.</param>
    /// <param name="description">Описание заказа.</param>
    public Order(string orderNumber, string description)
    {
        Id = Guid.NewGuid();
        OrderNumber = orderNumber;
        Description = description;
        Status = OrderStatus.created;
        CreatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Инициализирует новый заказ с указанным идентификатором (для восстановления из БД).
    /// </summary>
    /// <param name="id">Идентификатор заказа.</param>
    /// <param name="orderNumber">Номер заказа.</param>
    /// <param name="description">Описание заказа.</param>
    public Order(Guid id, string orderNumber, string description)
    {
        Id = id;
        OrderNumber = orderNumber;
        Description = description;
        Status = OrderStatus.created;
        CreatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Обновляет статус заказа.
    /// </summary>
    /// <param name="newStatus">Новый статус.</param>
    public void UpdateStatus(OrderStatus newStatus)
    {
        if (Status == newStatus)
            return;

        Status = newStatus;
        UpdatedAt = DateTime.UtcNow;
    }

    /// <summary>
    /// Обновляет описание заказа.
    /// </summary>
    /// <param name="newDescription">Новое описание.</param>
    public void UpdateDescription(string newDescription)
    {
        Description = newDescription;
        UpdatedAt = DateTime.UtcNow;
    }
}