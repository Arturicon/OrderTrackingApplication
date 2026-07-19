using Backend.Domain;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace OrderTracking.Application.Converters
{
    public class OrderStatusJsonConverter : JsonConverter<OrderStatus>
    {
        public override OrderStatus Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
        {
            var value = reader.GetString();
            return Enum.TryParse<OrderStatus>(value, true, out var result)
                ? result
                : OrderStatus.created;
        }

        public override void Write(Utf8JsonWriter writer, OrderStatus value, JsonSerializerOptions options)
        {
            writer.WriteStringValue(value.ToString()); // Записываем как строку
        }
    }
}