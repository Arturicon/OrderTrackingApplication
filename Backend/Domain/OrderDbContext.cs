using Microsoft.EntityFrameworkCore;

namespace Backend.Domain;

/// <summary>
/// Контекст базы данных для работы с заказами.
/// </summary>
public class OrderDbContext : DbContext
{
    /// <summary>
    /// Инициализирует новый экземпляр контекста базы данных.
    /// </summary>
    /// <param name="options">Настройки подключения к базе данных.</param>
    public OrderDbContext(DbContextOptions<OrderDbContext> options)
        : base(options)
    {
    }

    /// <summary>
    /// Набор сущностей заказов.
    /// </summary>
    public DbSet<Order> Orders { get; set; }

    /// <summary>
    /// Настраивает модель базы данных при ее создании.
    /// </summary>
    /// <param name="modelBuilder">Строитель модели для конфигурации сущностей.</param>
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.HasDefaultSchema("orders");
        modelBuilder.Entity<Order>(entity =>
        {
            entity.ToTable("orderDb", "orders");
        });
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