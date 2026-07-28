using Backend.Domain;
using Backend.Domain.Interfeces;
using Backend.RabbitMQ;
using Microsoft.EntityFrameworkCore;
using OpenTelemetry.Logs;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;



var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

AddOpenTelemetry(builder);

// Database
builder.Services.AddDbContext<OrderDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Repositories
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IOrderService, OrderService>();

// RabbitMQ
builder.Services.AddSingleton<IEventPublisher, RabbitMQEventPublisher>();
builder.Services.AddHostedService<RabbitMQHostedService>();

// Logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();

// CORS
var corsOrigins = Environment.GetEnvironmentVariable("CORS_ORIGINS")
                          ?? "http://localhost:5171";
var origins = corsOrigins.Split(';');
builder.Services.AddCors(opts =>
{
    opts.AddDefaultPolicy(pb => pb
    .WithOrigins(origins)
    //.AllowAnyOrigin()
    .AllowCredentials()
    .AllowAnyHeader()
    .AllowAnyMethod()
    );
});

var app = builder.Build();

app.UseCors();
app.UseAuthorization();
app.MapControllers();


using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<OrderDbContext>();
    dbContext.Database.Migrate();
}

app.Run();

static void AddOpenTelemetry(WebApplicationBuilder builder)
{
    // 1. Настройка ресурса (service.name)
    var serviceName = "my-awesome-service";
    var serviceVersion = "1.0.0";
    builder.Services.AddOpenTelemetry()
        .ConfigureResource(resource => resource
            .AddService(serviceName: serviceName, serviceVersion: serviceVersion))
        // 2. Настройка Tracing
        .WithTracing(tracing => tracing
            //.AddAspNetCoreInstrumentation() // Сбор ASP.NET Core трейсов
                                            //.AddHttpClientInstrumentation() // Для сбора трейсов исходящих HTTP-запросов
                                            // .AddSqlClientInstrumentation() // Для сбора трейсов SQL-запросов
            .AddConsoleExporter()) // Экспорт в консоль
                                   // 3. Настройка Metrics
        .WithMetrics(metrics => metrics
            .AddAspNetCoreInstrumentation() // Сбор ASP.NET Core метрик
            .AddConsoleExporter()); // Экспорт в консоль


    // 4. Настройка Logs (отдельно от IServiceCollection)
    builder.Logging.AddOpenTelemetry(logging => logging
        .AddConsoleExporter());
}