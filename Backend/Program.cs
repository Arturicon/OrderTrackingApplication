using Backend.Domain;
using Backend.Domain.Interfeces;
using Backend.RabbitMQ;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using OpenTelemetry.Logs;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Serilog;
using Serilog.Sinks.Elasticsearch;

//TODO реализовать Outbox


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
builder.Host.UseSerilog((context, config) =>
{
    config.ReadFrom.Configuration(context.Configuration) // Читаем настройки из appsettings.json
          .Enrich.FromLogContext() // Обогащает логи контекстной информацией
          .WriteTo.Console() // Дублируем в консоль для разработки
          .WriteTo.Elasticsearch(new ElasticsearchSinkOptions(
              new Uri(builder.Configuration["ElasticSearch:Url"])) // URL Elasticsearch из конфигурации
          {
              IndexFormat = $"{builder.Configuration["ElasticSearch:Index"]}{DateTime.UtcNow:yyyy.MM.dd}", // Формат индекса, например "myapp-logs-2026.08.28"
              AutoRegisterTemplate = true, // Автоматически создает шаблон индекса в Elasticsearch
              // CustomFormatter = new EcsTextFormatter() // Опционально: формат ECS
          });
});

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
app.UseOpenTelemetryPrometheusScrapingEndpoint();
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
    var serviceName = "my-awesome-service";
    var serviceVersion = "1.0.0";

    builder.Services.AddOpenTelemetry()
        .ConfigureResource(resource => resource
            .AddService(serviceName: serviceName, serviceVersion: serviceVersion))
        .WithTracing(tracing => tracing
            .AddAspNetCoreInstrumentation()
            .AddHttpClientInstrumentation()
            //.AddSqlClientInstrumentation()
            .AddEntityFrameworkCoreInstrumentation()
            .AddRabbitMQInstrumentation()
            .AddOtlpExporter(options =>            
            {
                options.Endpoint = new Uri("http://localhost:4317"); // gRPC эндпоинт Jaeger
                                                                     // Альтернатива: options.Endpoint = new Uri("http://localhost:4318/v1/traces");
            }))
        .WithMetrics(metrics => metrics
            .AddAspNetCoreInstrumentation()
            .AddPrometheusExporter()); // <--- ЭТО ГЛАВНОЕ

    builder.Logging.AddOpenTelemetry(logging => logging
        .AddConsoleExporter());
}