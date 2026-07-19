using Backend.Domain;
using Backend.Domain.Interfeces;
using Microsoft.Extensions.Logging;
using Moq;
using NUnit.Framework;

namespace Backend.Tests.Services;

[TestFixture]
public class OrderServiceTests
{
    private Mock<IOrderRepository> _orderRepositoryMock;
    private Mock<IEventPublisher> _eventPublisherMock;
    private Mock<ILogger<OrderService>> _loggerMock;
    private OrderService _orderService;

    [SetUp]
    public void SetUp()
    {
        _orderRepositoryMock = new Mock<IOrderRepository>();
        _eventPublisherMock = new Mock<IEventPublisher>();
        _loggerMock = new Mock<ILogger<OrderService>>();
        _orderService = new OrderService(
            _orderRepositoryMock.Object,
            _eventPublisherMock.Object,
            _loggerMock.Object);
    }

    [Test]
    public async Task CreateOrderAsync_WithValidDescription_ShouldCreateOrder()
    {
        // Arrange
        var description = "Test order";
        var expectedOrder = new Order("ORD-20260101-1234", description);
        _orderRepositoryMock.Setup(x => x.AddAsync(It.IsAny<Order>()))
            .ReturnsAsync(expectedOrder);

        // Act
        var result = await _orderService.CreateOrderAsync(description);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Description, Is.EqualTo(description));
        Assert.That(result.Status, Is.EqualTo(OrderStatus.created));
        _orderRepositoryMock.Verify(x => x.AddAsync(It.IsAny<Order>()), Times.Once);
    }

    [Test]
    public void CreateOrderAsync_WithEmptyDescription_ShouldThrowArgumentException()
    {
        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _orderService.CreateOrderAsync(""));
        Assert.That(ex.Message, Is.EqualTo("Description is required"));
    }

    [Test]
    public void CreateOrderAsync_WithWhitespaceDescription_ShouldThrowArgumentException()
    {
        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _orderService.CreateOrderAsync("   "));
        Assert.That(ex.Message, Is.EqualTo("Description is required"));
    }

    [Test]
    public async Task UpdateOrderStatusAsync_WithValidData_ShouldUpdateStatus()
    {
        // Arrange
        var orderId = Guid.NewGuid();
        var order = new Order("ORD-20260101-1234", "Test order");
        var newStatus = OrderStatus.delivered;
        var oldStatus = order.Status;

        _orderRepositoryMock.Setup(x => x.GetByIdAsync(orderId))
            .ReturnsAsync(order);
        _orderRepositoryMock.Setup(x => x.UpdateAsync(It.IsAny<Order>()))
            .ReturnsAsync(order);

        // Act
        var result = await _orderService.UpdateOrderStatusAsync(orderId, newStatus);

        // Assert
        Assert.That(result.Status, Is.EqualTo(newStatus));
        Assert.That(result.UpdatedAt, Is.Not.Null);
        _eventPublisherMock.Verify(x => x.PublishOrderStatusChangedEventAsync(order, oldStatus), Times.Once);
        _orderRepositoryMock.Verify(x => x.UpdateAsync(It.IsAny<Order>()), Times.Once);
    }

    [Test]
    public void UpdateOrderStatusAsync_WithNonExistentOrder_ShouldThrowKeyNotFoundException()
    {
        // Arrange
        var orderId = Guid.NewGuid();
        _orderRepositoryMock.Setup(x => x.GetByIdAsync(orderId))
            .ReturnsAsync((Order)null);

        // Act & Assert
        var ex = Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _orderService.UpdateOrderStatusAsync(orderId, OrderStatus.created));
        Assert.That(ex.Message, Is.EqualTo($"Order with ID {orderId} not found"));
    }

    [Test]
    public async Task GetOrderByIdAsync_WithValidId_ShouldReturnOrder()
    {
        // Arrange
        var orderId = Guid.NewGuid();
        var expectedOrder = new Order("ORD-20260101-1234", "Test order");
        _orderRepositoryMock.Setup(x => x.GetByIdAsync(orderId))
            .ReturnsAsync(expectedOrder);

        // Act
        var result = await _orderService.GetOrderByIdAsync(orderId);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.Id, Is.EqualTo(expectedOrder.Id));
        Assert.That(result.OrderNumber, Is.EqualTo(expectedOrder.OrderNumber));
    }

    [Test]
    public void GetOrderByIdAsync_WithInvalidId_ShouldThrowKeyNotFoundException()
    {
        // Arrange
        var orderId = Guid.NewGuid();
        _orderRepositoryMock.Setup(x => x.GetByIdAsync(orderId))
            .ReturnsAsync((Order)null);

        // Act & Assert
        var ex = Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _orderService.GetOrderByIdAsync(orderId));
        Assert.That(ex.Message, Is.EqualTo($"Order with ID {orderId} not found"));
    }

    [Test]
    public async Task GetAllOrdersAsync_WithoutFilter_ShouldReturnAllOrders()
    {
        // Arrange
        var orders = new List<Order>
        {
            new Order("ORD-20260101-0001", "Order 1"),
            new Order("ORD-20260101-0002", "Order 2")
        };
        _orderRepositoryMock.Setup(x => x.GetAllAsync())
            .ReturnsAsync(orders);

        // Act
        var result = await _orderService.GetAllOrdersAsync();

        // Assert
        Assert.That(result.Count(), Is.EqualTo(2));
        _orderRepositoryMock.Verify(x => x.GetAllAsync(), Times.Once);
        _orderRepositoryMock.Verify(x => x.GetByStatusAsync(It.IsAny<OrderStatus>()), Times.Never);
    }

    [Test]
    public async Task GetAllOrdersAsync_WithStatusFilter_ShouldReturnFilteredOrders()
    {
        // Arrange
        var status = OrderStatus.created;
        var orders = new List<Order>
        {
            new Order("ORD-20260101-0001", "Order 1")
        };
        _orderRepositoryMock.Setup(x => x.GetByStatusAsync(status))
            .ReturnsAsync(orders);

        // Act
        var result = await _orderService.GetAllOrdersAsync(status);

        // Assert
        Assert.That(result.Count(), Is.EqualTo(1));
        _orderRepositoryMock.Verify(x => x.GetByStatusAsync(status), Times.Once);
        _orderRepositoryMock.Verify(x => x.GetAllAsync(), Times.Never);
    }

    [Test]
    public async Task DeleteOrderAsync_WithValidId_ShouldDeleteOrder()
    {
        // Arrange
        var orderId = Guid.NewGuid();
        _orderRepositoryMock.Setup(x => x.ExistsAsync(orderId))
            .ReturnsAsync(true);

        // Act
        await _orderService.DeleteOrderAsync(orderId);

        // Assert
        _orderRepositoryMock.Verify(x => x.DeleteAsync(orderId), Times.Once);
    }

    [Test]
    public void DeleteOrderAsync_WithInvalidId_ShouldThrowKeyNotFoundException()
    {
        // Arrange
        var orderId = Guid.NewGuid();
        _orderRepositoryMock.Setup(x => x.ExistsAsync(orderId))
            .ReturnsAsync(false);

        // Act & Assert
        var ex = Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _orderService.DeleteOrderAsync(orderId));
        Assert.That(ex.Message, Is.EqualTo($"Order with ID {orderId} not found"));
        _orderRepositoryMock.Verify(x => x.DeleteAsync(It.IsAny<Guid>()), Times.Never);
    }

    [Test]
    public async Task GetOrderByNumberAsync_WithValidNumber_ShouldReturnOrder()
    {
        // Arrange
        var orderNumber = "ORD-20260101-1234";
        var expectedOrder = new Order(orderNumber, "Test order");
        _orderRepositoryMock.Setup(x => x.GetByOrderNumberAsync(orderNumber))
            .ReturnsAsync(expectedOrder);

        // Act
        var result = await _orderService.GetOrderByNumberAsync(orderNumber);

        // Assert
        Assert.That(result, Is.Not.Null);
        Assert.That(result.OrderNumber, Is.EqualTo(orderNumber));
    }

    [Test]
    public void GetOrderByNumberAsync_WithInvalidNumber_ShouldThrowKeyNotFoundException()
    {
        // Arrange
        var orderNumber = "INVALID";
        _orderRepositoryMock.Setup(x => x.GetByOrderNumberAsync(orderNumber))
            .ReturnsAsync((Order)null);

        // Act & Assert
        var ex = Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _orderService.GetOrderByNumberAsync(orderNumber));
        Assert.That(ex.Message, Is.EqualTo($"Order with number {orderNumber} not found"));
    }

    [Test]
    public async Task UpdateOrderDescriptionAsync_WithValidData_ShouldUpdateDescription()
    {
        // Arrange
        var orderId = Guid.NewGuid();
        var newDescription = "Updated description";
        var order = new Order("ORD-20260101-1234", "Old description");

        _orderRepositoryMock.Setup(x => x.GetByIdAsync(orderId))
            .ReturnsAsync(order);
        _orderRepositoryMock.Setup(x => x.UpdateAsync(It.IsAny<Order>()))
            .ReturnsAsync(order);

        // Act
        var result = await _orderService.UpdateOrderDescriptionAsync(orderId, newDescription);

        // Assert
        Assert.That(result.Description, Is.EqualTo(newDescription));
        Assert.That(result.UpdatedAt, Is.Not.Null);
        _orderRepositoryMock.Verify(x => x.UpdateAsync(It.IsAny<Order>()), Times.Once);
    }

    [Test]
    public void UpdateOrderDescriptionAsync_WithEmptyDescription_ShouldThrowArgumentException()
    {
        // Arrange
        var orderId = Guid.NewGuid();

        // Act & Assert
        var ex = Assert.ThrowsAsync<ArgumentException>(
            async () => await _orderService.UpdateOrderDescriptionAsync(orderId, ""));
        Assert.That(ex.Message, Is.EqualTo("Description is required"));
    }

    [Test]
    public void UpdateOrderDescriptionAsync_WithNonExistentOrder_ShouldThrowKeyNotFoundException()
    {
        // Arrange
        var orderId = Guid.NewGuid();
        _orderRepositoryMock.Setup(x => x.GetByIdAsync(orderId))
            .ReturnsAsync((Order)null);

        // Act & Assert
        var ex = Assert.ThrowsAsync<KeyNotFoundException>(
            async () => await _orderService.UpdateOrderDescriptionAsync(orderId, "New description"));
        Assert.That(ex.Message, Is.EqualTo($"Order with ID {orderId} not found"));
    }
}