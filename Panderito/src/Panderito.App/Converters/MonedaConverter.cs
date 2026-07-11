using System.Globalization;
using Panderito.Core.Services;

namespace Panderito.App.Converters;

/// <summary>decimal → "S/ 1,234.50".</summary>
public class MonedaConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture) =>
        value is decimal monto ? FormatoMoneda.EnSoles(monto) : FormatoMoneda.EnSoles(0m);

    public object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture) =>
        value is string texto && decimal.TryParse(
            texto.Replace("S/", string.Empty).Trim(),
            NumberStyles.Number, FormatoMoneda.CulturaPeru, out var monto)
            ? monto
            : 0m;
}
