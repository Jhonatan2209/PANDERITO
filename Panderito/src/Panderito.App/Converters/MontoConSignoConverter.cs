using System.Globalization;
using Panderito.Core.Models;
using Panderito.Core.Services;

namespace Panderito.App.Converters;

/// <summary>Movimiento → "+ S/ 100.00" (ingreso) o "- S/ 12.50" (gasto).</summary>
public class MontoConSignoConverter : IValueConverter
{
    public object Convert(object? value, Type targetType, object? parameter, CultureInfo culture) =>
        value is Movimiento m
            ? FormatoMoneda.ConSigno(m.Monto, m.Tipo == TipoMovimiento.Gasto)
            : string.Empty;

    public object ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture) =>
        throw new NotSupportedException();
}
