using Microsoft.AspNetCore.Http.Connections;
using NotifyService;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddHostedService<EventConsumer>();
builder.Services.AddSingleton<IEventProcessor, SignalREventProcessor>();
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


app.UseHttpsRedirection();

app.UseCors();
app.UseAuthorization();
app.MapControllers();
// Маршрутизация SignalR с ограничением транспорта
app.MapHub<OrderHub>("/orderHub", options =>
{
    // Разрешаем только WebSocket и Server-Sent Events
    options.Transports = HttpTransportType.WebSockets | HttpTransportType.ServerSentEvents;
});

app.Run();
