using Backend.Domain;
using OrderTracking.Application.Converters;
using System.Text.Json.Serialization;

namespace Backend.Controllers;


/// <summary>
/// DTO (Data Transfer Object) для передачи данных о заказе между клиентом и сервером.
/// </summary>
public class OrderDto
{
    /// <summary>
    /// Уникальный идентификатор заказа.
    /// </summary>
    /// <value>GUID идентификатор.</value>
    public Guid Id { get; set; }

    /// <summary>
    /// Уникальный номер заказа в человекочитаемом формате.
    /// </summary>
    /// <value>Строковый номер заказа (например, "ORD-2026-001").</value>
    public string OrderNumber { get; set; } = string.Empty;

    /// <summary>
    /// Описание заказа.
    /// </summary>
    /// <value>Текстовое описание содержимого или назначения заказа.</value>
    public string Description { get; set; } = string.Empty;

    /// <summary>
    /// Текущий статус заказа.
    /// </summary>
    /// <value>Значение из перечисления <see cref="OrderStatus"/>.</value>
    [JsonConverter(typeof(OrderStatusJsonConverter))]
    public OrderStatus Status { get; set; }

    /// <summary>
    /// Получает строковое представление статуса заказа.
    /// </summary>
    /// <value>Имя статуса из перечисления <see cref="OrderStatus"/>.</value>
    public string StatusName => Status.ToString();     /// TODO: Определить необходимость этого свойства.

    /// <summary>
    /// Дата и время создания заказа.
    /// </summary>
    /// <value>Дата в формате UTC.</value>
    public DateTime CreatedAt { get; set; }

    /// <summary>
    /// Дата и время последнего обновления заказа.
    /// </summary>
    /// <value>Дата в формате UTC или null, если заказ не обновлялся.</value>
    public DateTime? UpdatedAt { get; set; }

    /// <summary>
    /// Создает DTO из доменной сущности заказа.
    /// </summary>
    /// <param name="order">Доменная сущность <see cref="Order"/>.</param>
    /// <returns>Объект <see cref="OrderDto"/> с заполненными данными.</returns>
    /// <exception cref="ArgumentNullException">Выбрасывается, если <paramref name="order"/> равен null.</exception>
    public static OrderDto FromOrder(Order order)
    {
        if (order == null)
            throw new ArgumentNullException(nameof(order));

        return new OrderDto
        {
            Id = order.Id,
            OrderNumber = order.OrderNumber,
            Description = order.Description,
            Status = order.Status,
            CreatedAt = order.CreatedAt,
            UpdatedAt = order.UpdatedAt
        };
    }
}
