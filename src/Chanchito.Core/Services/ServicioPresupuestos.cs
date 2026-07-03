using Chanchito.Core.Data;
using Chanchito.Core.Models;

namespace Chanchito.Core.Services;

public enum NivelPresupuesto
{
    Normal = 0,   // < 80 %
    Alerta = 1,   // >= 80 % y < 100 %
    Excedido = 2  // >= 100 %
}

public record AvancePresupuesto(decimal Gastado, decimal Limite, double Porcentaje, NivelPresupuesto Nivel);

/// <summary>Avance de presupuestos por categoría con umbrales de 80 % y 100 %.</summary>
public class ServicioPresupuestos
{
    private readonly ChanchitoDatabase _db;

    public ServicioPresupuestos(ChanchitoDatabase db)
    {
        _db = db;
    }

    public static AvancePresupuesto CalcularAvance(decimal limite, decimal gastado)
    {
        var porcentaje = limite <= 0 ? 0 : (double)(gastado / limite) * 100.0;
        var nivel = porcentaje >= 100 ? NivelPresupuesto.Excedido
                  : porcentaje >= 80 ? NivelPresupuesto.Alerta
                  : NivelPresupuesto.Normal;
        return new AvancePresupuesto(gastado, limite, porcentaje, nivel);
    }

    /// <summary>Avance del presupuesto en el período que contiene la fecha dada (semana/quincena/mes calendario).</summary>
    public async Task<AvancePresupuesto> CalcularAvanceAsync(Presupuesto presupuesto, DateTime fechaReferencia)
    {
        await _db.InicializarAsync();
        var (desde, hasta) = RangoDelPeriodo(presupuesto.Periodo, fechaReferencia);
        var movimientos = await _db.Connection.Table<Movimiento>()
            .Where(m => m.CategoriaId == presupuesto.CategoriaId
                        && m.Fecha >= desde && m.Fecha < hasta)
            .ToListAsync();
        var gastado = movimientos.Where(m => m.Tipo == TipoMovimiento.Gasto).Sum(m => m.Monto);
        return CalcularAvance(presupuesto.MontoLimite, gastado);
    }

    public static (DateTime Desde, DateTime Hasta) RangoDelPeriodo(Frecuencia periodo, DateTime fecha)
    {
        switch (periodo)
        {
            case Frecuencia.Semanal:
                // Semana lunes a domingo
                var diasDesdeLunes = ((int)fecha.DayOfWeek + 6) % 7;
                var lunes = fecha.Date.AddDays(-diasDesdeLunes);
                return (lunes, lunes.AddDays(7));
            case Frecuencia.Quincenal:
                var inicioMes = new DateTime(fecha.Year, fecha.Month, 1);
                return fecha.Day <= 15
                    ? (inicioMes, inicioMes.AddDays(15))
                    : (inicioMes.AddDays(15), inicioMes.AddMonths(1));
            default:
                var primerDia = new DateTime(fecha.Year, fecha.Month, 1);
                return (primerDia, primerDia.AddMonths(1));
        }
    }
}
