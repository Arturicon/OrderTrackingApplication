using Backend.Domain;
using Backend.Domain.Entities;
using Backend.RabbitMQ;
using Microsoft.AspNetCore.Http.Connections;
using Microsoft.EntityFrameworkCore;



var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Repositories
//builder.Services.AddScoped<IOrderRepository, OrderRepository>(); //todo
builder.Services.AddScoped<IOrderRepository, OrderTestRepository>();
builder.Services.AddScoped<IOrderService, OrderService>();

// RabbitMQ
builder.Services.AddSingleton<IEventPublisher, RabbitMQEventPublisher>();
builder.Services.AddHostedService<RabbitMQHostedService>();

// Logging
builder.Logging.ClearProviders();
builder.Logging.AddConsole();
//builder.Logging.AddFile("logs/order-tracking-{Date}.log");
builder.Services.AddSignalR();
// CORS
builder.Services.AddCors(opts =>
{
    opts.AddDefaultPolicy(pb => pb
    .WithOrigins("http://localhost:5171")
    //.AllowAnyOrigin()
    .AllowCredentials()
    .AllowAnyHeader()
    .AllowAnyMethod()
    );
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseAuthorization();
app.MapControllers();
// Маршрутизация SignalR с ограничением транспорта
app.MapHub<OrderHub>("/orderHub", options =>
{
    // Разрешаем только WebSocket и Server-Sent Events
    options.Transports = HttpTransportType.WebSockets | HttpTransportType.ServerSentEvents;
});


// Apply migrations
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
    dbContext.Database.Migrate();
}

app.Run();