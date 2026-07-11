using Microsoft.EntityFrameworkCore;
namespace Backend.Domain.Entities;


public class OrderTestRepository : IOrderRepository
{
    private static readonly List<Order> _orders = OrderDtoSamples.GetAllOrders();
    public async Task<Order> AddAsync(Order order)
    {
        _orders.Add(order);
        return order;
    }

    public Task DeleteAsync(Guid id)
    {
        throw new NotImplementedException();
    }

    public Task<bool> ExistsAsync(Guid id)
    {
        throw new NotImplementedException();
    }

    public async Task<IEnumerable<Order>> GetAllAsync()
    {
        return _orders.OrderByDescending(o => o.CreatedAt).ToList();
    }

    public async Task<Order> GetByIdAsync(Guid id)
    {
        return _orders.FirstOrDefault(x => x.Id == id);
    }

    public Task<Order> GetByOrderNumberAsync(string orderNumber)
    {
        throw new NotImplementedException();
    }

    public async Task<IEnumerable<Order>> GetByStatusAsync(OrderStatus status)
    {
        return _orders.Where(x => x.Status == status);
    }

    public Task<bool> OrderNumberExistsAsync(string orderNumber)
    {
        throw new NotImplementedException();
    }

    public Task<Order> UpdateAsync(Order order)
    {
        return Task.Run(()=>order);
    }
}

public class OrderRepository : IOrderRepository
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<OrderRepository> _logger;

    public OrderRepository(ApplicationDbContext context, ILogger<OrderRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<Order> GetByIdAsync(Guid id)
    {
        return await _context.Orders.FindAsync(id);
    }

    public async Task<Order> GetByOrderNumberAsync(string orderNumber)
    {
        return await _context.Orders
            .FirstOrDefaultAsync(o => o.OrderNumber == orderNumber);
    }

    public async Task<IEnumerable<Order>> GetAllAsync()
    {
        return await _context.Orders
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
    }

    public async Task<IEnumerable<Order>> GetByStatusAsync(OrderStatus status)
    {
        return await _context.Orders
            .Where(o => o.Status == status)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
    }

    public async Task<Order> AddAsync(Order order)
    {
        await _context.Orders.AddAsync(order);
        await _context.SaveChangesAsync();
        return order;
    }

    public async Task<Order> UpdateAsync(Order order)
    {
        _context.Orders.Update(order);
        await _context.SaveChangesAsync();
        return order;
    }

    public async Task DeleteAsync(Guid id)
    {
        var order = await GetByIdAsync(id);
        if (order != null)
        {
            _context.Orders.Remove(order);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<bool> ExistsAsync(Guid id)
    {
        return await _context.Orders.AnyAsync(o => o.Id == id);
    }

    public async Task<bool> OrderNumberExistsAsync(string orderNumber)
    {
        return await _context.Orders.AnyAsync(o => o.OrderNumber == orderNumber);
    }
}

//todo delete
public static class OrderDtoSamples
{
    // 1. Базовый заказ - создан
    public static Order SampleOrder1 => new Order(
        orderNumber: "ORD-20240709-1234",
        description: "iPhone 15 Pro Max 256GB - Space Black"
    );

    // 2. Отправленный заказ
    public static Order SampleOrder2
    {
        get
        {
            var order = new Order(
                orderNumber: "ORD-20240709-2345",
                description: "MacBook Pro 14 M3 Pro - Silver"
            );
            // Меняем статус на shipped и устанавливаем дату обновления
            order.UpdateStatus(OrderStatus.shipped);
            // В реальном коде нельзя изменить CreatedAt, но для демонстрации используем рефлексию
            SetPrivateField(order, "_createdAt", DateTime.UtcNow.AddDays(-3));
            SetPrivateField(order, "_updatedAt", DateTime.UtcNow.AddDays(-1));
            return order;
        }
    }

    // 3. Доставленный заказ
    public static Order SampleOrder3
    {
        get
        {
            var order = new Order(
                orderNumber: "ORD-20240708-3456",
                description: "Samsung 49\" Odyssey G9 Gaming Monitor"
            );
            order.UpdateStatus(OrderStatus.delivered);
            SetPrivateField(order, "_createdAt", DateTime.UtcNow.AddDays(-10));
            SetPrivateField(order, "_updatedAt", DateTime.UtcNow.AddDays(-2));
            return order;
        }
    }

    // 4. Отмененный заказ
    public static Order SampleOrder4
    {
        get
        {
            var order = new Order(
                orderNumber: "ORD-20240707-4567",
                description: "PS5 Digital Edition + DualSense Charging Station"
            );
            order.UpdateStatus(OrderStatus.cancelled);
            SetPrivateField(order, "_createdAt", DateTime.UtcNow.AddDays(-5));
            SetPrivateField(order, "_updatedAt", DateTime.UtcNow.AddDays(-3));
            return order;
        }
    }

    // 5. Созданный сегодня
    public static Order SampleOrder5 => new Order(
        orderNumber: "ORD-20240709-5678",
        description: "NVIDIA RTX 4080 Super 16GB GDDR6X"
    );

    // 6. Отправлен вчера
    public static Order SampleOrder6
    {
        get
        {
            var order = new Order(
                orderNumber: "ORD-20240708-6789",
                description: "Logitech MX Master 3S + MX Mechanical Keyboard"
            );
            order.UpdateStatus(OrderStatus.shipped);
            SetPrivateField(order, "_createdAt", DateTime.UtcNow.AddDays(-2));
            SetPrivateField(order, "_updatedAt", DateTime.UtcNow.AddDays(-1));
            return order;
        }
    }

    // 7. Доставлен сегодня
    public static Order SampleOrder7
    {
        get
        {
            var order = new Order(
                orderNumber: "ORD-20240709-7890",
                description: "Samsung Galaxy S24 Ultra 512GB - Titanium Violet"
            );
            order.UpdateStatus(OrderStatus.delivered);
            SetPrivateField(order, "_createdAt", DateTime.UtcNow.AddDays(-7));
            SetPrivateField(order, "_updatedAt", DateTime.UtcNow.AddHours(-3));
            return order;
        }
    }

    // 8. Отменен в процессе
    public static Order SampleOrder8
    {
        get
        {
            var order = new Order(
                orderNumber: "ORD-20240706-8901",
                description: "Bose QuietComfort Ultra Headphones"
            );
            order.UpdateStatus(OrderStatus.cancelled);
            SetPrivateField(order, "_createdAt", DateTime.UtcNow.AddDays(-4));
            SetPrivateField(order, "_updatedAt", DateTime.UtcNow.AddDays(-2));
            return order;
        }
    }

    // 9. Недавно создан
    public static Order SampleOrder9 => new Order(
        orderNumber: "ORD-20240709-9012",
        description: "DJI Mini 4 Pro Fly More Combo"
    );

    // 10. Доставлен давно
    public static Order SampleOrder10
    {
        get
        {
            var order = new Order(
                orderNumber: "ORD-20240615-0123",
                description: "SteelSeries Arctis Nova Pro Wireless Headset"
            );
            order.UpdateStatus(OrderStatus.delivered);
            SetPrivateField(order, "_createdAt", DateTime.UtcNow.AddDays(-25));
            SetPrivateField(order, "_updatedAt", DateTime.UtcNow.AddDays(-20));
            return order;
        }
    }

    // Вспомогательный метод для установки приватных полей (только для демонстрации)
    private static void SetPrivateField(object obj, string fieldName, object value)
    {
        var field = obj.GetType().GetField(fieldName, System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
        if (field != null)
        {
            field.SetValue(obj, value);
        }
    }

    public static List<Order> GetAllOrders()
    {
        return new List<Order>
        {
            SampleOrder1,
            SampleOrder2,
            SampleOrder3,
            SampleOrder4,
            SampleOrder5,
            SampleOrder6,
            SampleOrder7,
            SampleOrder8,
            SampleOrder9,
            SampleOrder10,
        };
    }

    // Альтернативный метод с использованием рефлексии для полной настройки
    public static List<Order> GetAllOrdersWithReflection()
    {
        var orders = new List<Order>
        {
            new Order("ORD-20240709-1234", "iPhone 15 Pro Max 256GB - Space Black"),
            new Order("ORD-20240709-2345", "MacBook Pro 14 M3 Pro - Silver"),
            new Order("ORD-20240708-3456", "Samsung 49\" Odyssey G9 Gaming Monitor"),
            new Order("ORD-20240707-4567", "PS5 Digital Edition + DualSense Charging Station"),
            new Order("ORD-20240709-5678", "NVIDIA RTX 4080 Super 16GB GDDR6X"),
            new Order("ORD-20240708-6789", "Logitech MX Master 3S + MX Mechanical Keyboard"),
            new Order("ORD-20240709-7890", "Samsung Galaxy S24 Ultra 512GB - Titanium Violet"),
            new Order("ORD-20240706-8901", "Bose QuietComfort Ultra Headphones"),
            new Order("ORD-20240709-9012", "DJI Mini 4 Pro Fly More Combo"),
            new Order("ORD-20240615-0123", "SteelSeries Arctis Nova Pro Wireless Headset"),
        };

        // Настройка статусов и дат через рефлексию
        var statuses = new[]
        {
            OrderStatus.created,
            OrderStatus.shipped,
            OrderStatus.delivered,
            OrderStatus.cancelled,
            OrderStatus.created,
            OrderStatus.shipped,
            OrderStatus.delivered,
            OrderStatus.cancelled,
            OrderStatus.created,
            OrderStatus.delivered
        };

        var createdAtDates = new[]
        {
            DateTime.UtcNow.AddHours(-2),
            DateTime.UtcNow.AddDays(-3),
            DateTime.UtcNow.AddDays(-10),
            DateTime.UtcNow.AddDays(-5),
            DateTime.UtcNow.AddMinutes(-30),
            DateTime.UtcNow.AddDays(-2),
            DateTime.UtcNow.AddDays(-7),
            DateTime.UtcNow.AddDays(-4),
            DateTime.UtcNow.AddMinutes(-5),
            DateTime.UtcNow.AddDays(-25)
        };

        var updatedAtDates = new DateTime?[]
        {
            null,
            DateTime.UtcNow.AddDays(-1),
            DateTime.UtcNow.AddDays(-2),
            DateTime.UtcNow.AddDays(-3),
            null,
            DateTime.UtcNow.AddDays(-1),
            DateTime.UtcNow.AddHours(-3),
            DateTime.UtcNow.AddDays(-2),
            null,
            DateTime.UtcNow.AddDays(-20)
        };

        for (int i = 0; i < orders.Count; i++)
        {
            var order = orders[i];

            // Устанавливаем статус
            if (statuses[i] != OrderStatus.created)
            {
                order.UpdateStatus(statuses[i]);
            }

            // Устанавливаем даты через рефлексию
            SetPrivateField(order, "_createdAt", createdAtDates[i]);
            SetPrivateField(order, "_updatedAt", updatedAtDates[i]);
        }

        return orders;
    }
}
