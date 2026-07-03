using System.Globalization;

namespace Chanchito.App.Converters;

/// <summary>"#RRGGBB" (string del modelo) → Color; nunca lanza por dato inválido.</summary>
public class ColorHexConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        if (value is string hex && !string.IsNullOrWhiteSpace(hex) && Color.TryParse(hex, out var color))
            return color;
        return Colors.Gray;
    }

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture) =>
        value is Color color ? color.ToArgbHex() : "#6B7280";
}
