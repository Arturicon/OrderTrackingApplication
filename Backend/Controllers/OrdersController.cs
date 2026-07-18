using Backend.Domain;
using Backend.Domain.Entities;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using OrderTracking.Application.Converters;
using System.Net.NetworkInformation;
using System.Text.Json.Serialization;

namespace Backend.Controllers;


[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orderService;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(IOrderService orderService, ILogger<OrdersController> logger)
    {
        _orderService = orderService;
        _logger = logger;
    }


    /// <summary>
    /// Получить все заказы
    /// </summary>
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
            return StatusCode(500, new
            {
                Error = ex.Message,
                StackTrace = ex.StackTrace,
                InnerError = ex.InnerException?.Message
            });
        }

    }

    /// <summary>
    /// Получить заказ по ID
    /// </summary>
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
            return NotFound($"Order with ID {id} not found");
        }
    }

    /// <summary>
    /// Получить заказ по номеру заказа
    /// </summary>
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
            return NotFound($"Order with number {orderNumber} not found");
        }
    }

    /// <summary>
    /// Создать новый заказ
    /// </summary>
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
            return BadRequest(ex.Message);
        }
    }

    /// <summary>
    /// Обновить статус заказа (для тестов)
    /// </summary>
    [HttpPut("[action]")]
    public async Task<IActionResult> UpdateOrderStatus([FromQuery] Guid id, [FromQuery] OrderStatus status)
    {
        _logger.LogInformation("Updating order status for Order ID: {OrderId} to {Status}", id, status);

        if (!Enum.IsDefined(typeof(OrderStatus), status))
        {
            return BadRequest("Invalid order status");
        }

        try
        {
            var updatedOrder = await _orderService.UpdateOrderStatusAsync(id, status);
            return Ok(OrderDto.FromOrder(updatedOrder));
        }
        catch (KeyNotFoundException)
        {
            return NotFound($"Order with ID {id} not found");
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }



    /// <summary>
    /// Удалить заказ
    /// </summary>
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
            return NotFound($"Order with ID {id} not found");
        }
    }




    public class OrderDto
    {
        public Guid Id { get; set; }
        public string OrderNumber { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        [JsonConverter(typeof(OrderStatusJsonConverter))]
        public OrderStatus Status { get; set; }
        public string StatusName => Status.ToString(); //todo разобраться с необходимостью этого
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        public static OrderDto FromOrder(Order order)
        {
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

    public class CreateOrderDto
    {
        public string Description { get; set; } = string.Empty;
    }



    public class UpdateOrderDescriptionDto
    {
        public string Description { get; set; } = string.Empty;
    }
}