using Backend.Domain.Interfeces;
using Microsoft.EntityFrameworkCore;

namespace Backend.Domain;

/// <summary>
/// Репозиторий для работы с заказами в базе данных.
/// </summary>
public class OrderRepository : IOrderRepository
{
    private readonly OrderDbContext _context;
    private readonly ILogger<OrderRepository> _logger;

    /// <summary>
    /// Инициализирует новый экземпляр репозитория <see cref="OrderRepository"/>.
    /// </summary>
    /// <param name="context">Контекст базы данных.</param>
    /// <param name="logger">Сервис логирования.</param>
    public OrderRepository(OrderDbContext context, ILogger<OrderRepository> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// Получает заказ по идентификатору.
    /// </summary>
    /// <param name="id">Идентификатор заказа.</param>
    /// <returns>Заказ или null, если не найден.</returns>
    public async Task<Order> GetByIdAsync(Guid id)
    {
        return await _context.Orders.FindAsync(id);
    }

    /// <summary>
    /// Получает заказ по номеру.
    /// </summary>
    /// <param name="orderNumber">Номер заказа.</param>
    /// <returns>Заказ или null, если не найден.</returns>
    public async Task<Order> GetByOrderNumberAsync(string orderNumber)
    {
        return await _context.Orders
            .FirstOrDefaultAsync(o => o.OrderNumber == orderNumber);
    }

    /// <summary>
    /// Получает все заказы, отсортированные по дате создания (сначала новые).
    /// </summary>
    /// <returns>Коллекция заказов.</returns>
    public async Task<IEnumerable<Order>> GetAllAsync()
    {
        return await _context.Orders
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
    }

    /// <summary>
    /// Получает заказы по статусу, отсортированные по дате создания (сначала новые).
    /// </summary>
    /// <param name="status">Статус заказа.</param>
    /// <returns>Коллекция заказов.</returns>
    public async Task<IEnumerable<Order>> GetByStatusAsync(OrderStatus status)
    {
        return await _context.Orders
            .Where(o => o.Status == status)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();
    }

    /// <summary>
    /// Добавляет новый заказ в базу данных.
    /// </summary>
    /// <param name="order">Заказ для добавления.</param>
    /// <returns>Добавленный заказ.</returns>
    public async Task<Order> AddAsync(Order order)
    {
        await _context.Orders.AddAsync(order);
        await _context.SaveChangesAsync();
        return order;
    }

    /// <summary>
    /// Обновляет существующий заказ.
    /// </summary>
    /// <param name="order">Заказ с обновленными данными.</param>
    /// <returns>Обновленный заказ.</returns>
    public async Task<Order> UpdateAsync(Order order)
    {
        _context.Orders.Update(order);
        await _context.SaveChangesAsync();
        return order;
    }

    /// <summary>
    /// Удаляет заказ по идентификатору.
    /// </summary>
    /// <param name="id">Идентификатор заказа.</param>
    public async Task DeleteAsync(Guid id)
    {
        var order = await GetByIdAsync(id);
        if (order != null)
        {
            _context.Orders.Remove(order);
            await _context.SaveChangesAsync();
        }
    }

    /// <summary>
    /// Проверяет существование заказа по идентификатору.
    /// </summary>
    /// <param name="id">Идентификатор заказа.</param>
    /// <returns>true, если заказ существует, иначе false.</returns>
    public async Task<bool> ExistsAsync(Guid id)
    {
        return await _context.Orders.AnyAsync(o => o.Id == id);
    }

    /// <summary>
    /// Проверяет существование заказа по номеру.
    /// </summary>
    /// <param name="orderNumber">Номер заказа.</param>
    /// <returns>true, если заказ с таким номером существует, иначе false.</returns>
    public async Task<bool> OrderNumberExistsAsync(string orderNumber)
    {
        return await _context.Orders.AnyAsync(o => o.OrderNumber == orderNumber);
    }
}