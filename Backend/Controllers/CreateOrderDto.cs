namespace Backend.Controllers;


/// <summary>
/// DTO (Data Transfer Object) для создания нового заказа.
/// </summary>
public class CreateOrderDto
{
    /// <summary>
    /// Описание заказа.
    /// </summary>
    /// <value>Текстовое описание содержимого или назначения заказа.</value>
    public string Description { get; set; } = string.Empty;
}



