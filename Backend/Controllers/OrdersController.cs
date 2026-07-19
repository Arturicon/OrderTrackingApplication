using Backend.Domain;
using Backend.Domain.Interfeces;
using Microsoft.AspNetCore.Mvc;

namespace Backend.Controllers;

/// <summary>
/// Контроллер для управления заказами.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public partial class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;
    private readonly ILogger<OrdersController> _logger;

    /// <summary>
    /// Инициализирует новый экземпляр контроллера <see cref="OrdersController"/>.
    /// </summary>
    /// <param name="orderService">Сервис для работы с заказами.</param>
    /// <param name="logger">Сервис логирования.</param>
    /// <exception cref="ArgumentNullException">Выбрасывается, если orderService или logger равны null.</exception>
    public OrdersController(IOrderService orderService, ILogger<OrdersController> logger)
    {
        _orderService = orderService;
        _logger = logger;
    }

    /// <summary>
    /// Получает список всех заказов с возможностью фильтрации по статусу.
    /// </summary>
    /// <param name="status">Статус заказа для фильтрации. Если не указан, возвращаются все заказы.</param>
    /// <returns>Коллекция объектов <see cref="OrderDto"/>.</returns>
    /// <response code="200">Успешное получение списка заказов.</response>
    /// <response code="500">Внутренняя ошибка сервера.</response>
    [HttpGet("[action]")]
    public async Task<IActionResult> GetAllOrders([FromQuery] OrderStatus? status)
    {
        try
        {
            _logger.LogInformation("Getting all orders with status filter: {Status}", status);

            var orders = await _orderService.GetAllOrdersAsync(status);
            var orderDtos = orders.Select(OrderDto.FromOrder);

            return Ok(orderDtos);
        }
        catch(Exception ex)
        {
            _logger.LogError(ex, "Error getting all orders with status: {Status}", status);
            return StatusCode(500, new
            {
                Error = ex.Message,
                StackTrace = ex.StackTrace,
                InnerError = ex.InnerException?.Message
            });
        }
    }

    /// <summary>
    /// Получает заказ по уникальному идентификатору.
    /// </summary>
    /// <param name="id">Идентификатор заказа (GUID).</param>
    /// <returns>Объект <see cref="OrderDto"/>.</returns>
    /// <response code="200">Заказ успешно найден.</response>
    /// <response code="404">Заказ с указанным ID не найден.</response>
    [HttpGet("[action]/{id}")]
    public async Task<IActionResult> GetOrder(Guid id)
    {
        _logger.LogInformation("Getting order with ID: {OrderId}", id);

        try
        {
            var order = await _orderService.GetOrderByIdAsync(id);
            return Ok(OrderDto.FromOrder(order));
        }
        catch (KeyNotFoundException)
        {
            _logger.LogWarning("Order with ID: {OrderId} not found", id);
            return NotFound($"Order with ID {id} not found");
        }
    }

    /// <summary>
    /// Получает заказ по его номеру.
    /// </summary>
    /// <param name="orderNumber">Уникальный номер заказа.</param>
    /// <returns>Объект <see cref="OrderDto"/>.</returns>
    /// <response code="200">Заказ успешно найден.</response>
    /// <response code="404">Заказ с указанным номером не найден.</response>
    [HttpGet("[action]/{orderNumber}")]
    public async Task<IActionResult> GetOrderByNumber(string orderNumber)
    {
        _logger.LogInformation("Getting order with number: {OrderNumber}", orderNumber);

        try
        {
            var order = await _orderService.GetOrderByNumberAsync(orderNumber);
            return Ok(OrderDto.FromOrder(order));
        }
        catch (KeyNotFoundException)
        {
            _logger.LogWarning("Order with number: {OrderNumber} not found", orderNumber);
            return NotFound($"Order with number {orderNumber} not found");
        }
    }

    /// <summary>
    /// Создает новый заказ.
    /// </summary>
    /// <param name="createOrderDto">Данные для создания заказа.</param>
    /// <returns>Созданный объект <see cref="OrderDto"/>.</returns>
    /// <response code="200">Заказ успешно создан.</response>
    /// <response code="400">Некорректные данные запроса.</response>
    /// <exception cref="ArgumentException">Выбрасывается, если описание заказа невалидно.</exception>
    [HttpPost("[action]")]
    public async Task<ActionResult<OrderDto>> CreateOrder([FromBody] CreateOrderDto createOrderDto)
    {
        _logger.LogInformation("Creating new order with description: {Description}", createOrderDto.Description);

        try
        {
            var createdOrder = await _orderService.CreateOrderAsync(createOrderDto.Description);
            var orderDto = OrderDto.FromOrder(createdOrder);

            return Ok(orderDto);
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Validation error: {Error}", ex.Message);
            return BadRequest(ex.Message);
        }
    }

    /// <summary>
    /// Обновляет статус заказа.
    /// </summary>
    /// <param name="id">Идентификатор заказа (GUID).</param>
    /// <param name="status">Новый статус из перечисления <see cref="OrderStatus"/>.</param>
    /// <returns>Обновленный объект <see cref="OrderDto"/>.</returns>
    /// <response code="200">Статус успешно обновлен.</response>
    /// <response code="400">Недопустимый статус или нарушение бизнес-правил.</response>
    /// <response code="404">Заказ с указанным ID не найден.</response>
    /// <exception cref="KeyNotFoundException">Выбрасывается, если заказ не найден.</exception>
    /// <exception cref="ArgumentException">Выбрасывается при недопустимом переходе статуса.</exception>
    [HttpPut("[action]")]
    public async Task<IActionResult> UpdateOrderStatus([FromQuery] Guid id, [FromQuery] OrderStatus status)
    {
        _logger.LogInformation("Updating order status for Order ID: {OrderId} to {Status}", id, status);

        if (!Enum.IsDefined(typeof(OrderStatus), status))
        {
            _logger.LogWarning("Invalid order status value: {Status}", status);
            return BadRequest("Invalid order status");
        }

        try
        {
            var updatedOrder = await _orderService.UpdateOrderStatusAsync(id, status);
            return Ok(OrderDto.FromOrder(updatedOrder));
        }
        catch (KeyNotFoundException)
        {
            _logger.LogWarning("Order with ID: {OrderId} not found", id);
            return NotFound($"Order with ID {id} not found");
        }
        catch (ArgumentException ex)
        {
            _logger.LogWarning("Validation error: {Error}", ex.Message);
            return BadRequest(ex.Message);
        }
    }

    /// <summary>
    /// Удаляет заказ по идентификатору.
    /// </summary>
    /// <param name="id">Идентификатор заказа (GUID).</param>
    /// <response code="204">Заказ успешно удален.</response>
    /// <response code="404">Заказ с указанным ID не найден.</response>
    /// <exception cref="KeyNotFoundException">Выбрасывается, если заказ не найден.</exception>
    [HttpDelete("[action]/{id}")]
    public async Task<IActionResult> DeleteOrder(Guid id)
    {
        _logger.LogInformation("Deleting order with ID: {OrderId}", id);

        try
        {
            await _orderService.DeleteOrderAsync(id);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            _logger.LogWarning("Order with ID: {OrderId} not found", id);
            return NotFound($"Order with ID {id} not found");
        }
    }
}