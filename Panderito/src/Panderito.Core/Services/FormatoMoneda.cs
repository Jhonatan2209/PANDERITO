using System.Globalization;

namespace Panderito.Core.Services;

/// <summary>Formato de montos en Soles peruanos: "S/ 1,234.50".</summary>
public static class FormatoMoneda
{
    public static readonly CultureInfo CulturaPeru = CultureInfo.GetCultureInfo("es-PE");

    public static string EnSoles(decimal monto) =>
        string.Format(CulturaPeru, "S/ {0:#,##0.00}", monto);

    /// <summary>Con signo según el tipo: gastos en negativo ("− S/ 12.50"), ingresos con "+".</summary>
    public static string ConSigno(decimal monto, bool esGasto) =>
        esGasto ? $"- {EnSoles(monto)}" : $"+ {EnSoles(monto)}";
}
