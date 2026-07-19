using Backend.Domain;
using Backend.Domain.Interfeces;
using Backend.RabbitMQ;
using Microsoft.EntityFrameworkCore;



var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();


// Database
builder.Services.AddDbContext<OrderDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Repositories
builder.Services.AddScoped<IOrderRepository, OrderRepository>(); //todo
//builder.Services.AddScoped<IOrderRepository, OrderTestRepository>();
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