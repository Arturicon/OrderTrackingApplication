using System.Collections.Generic;
using System.Reflection.Emit;
using Microsoft.EntityFrameworkCore;


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


public interface IOrderRepository
{
    Task<Order> GetByIdAsync(Guid id);
    Task<Order> GetByOrderNumberAsync(string orderNumber);
    Task<IEnumerable<Order>> GetAllAsync();
    Task<IEnumerable<Order>> GetByStatusAsync(OrderStatus status);
    Task<Order> AddAsync(Order order);
    Task<Order> UpdateAsync(Order order);
    Task DeleteAsync(Guid id);
    Task<bool> ExistsAsync(Guid id);
    Task<bool> OrderNumberExistsAsync(string orderNumber);
}

public interface IEventPublisher
{
    Task PublishOrderStatusChangedEventAsync(Order order, OrderStatus oldStatus);
    Task SetConnection(IConfiguration configuration);
}





public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    public DbSet<Order> Orders { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.OrderNumber)
                .IsRequired()
                .HasMaxLength(50);

            entity.Property(e => e.Description)
                .IsRequired()
                .HasMaxLength(500);

            entity.Property(e => e.Status)
                .IsRequired();

            entity.Property(e => e.CreatedAt)
                .IsRequired();

            entity.HasIndex(e => e.OrderNumber)
                .IsUnique();
        });
    }
}
