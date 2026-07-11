using Panderito.Core.Data;
using Panderito.Core.Models;

namespace Panderito.Core.Services;

/// <summary>Gastos recurrentes: próximos pagos y avance de fechas.</summary>
public class ServicioRecurrentes
{
    private readonly PanderitoDatabase _db;

    public ServicioRecurrentes(PanderitoDatabase db)
    {
        _db = db;
    }

    public static DateTime CalcularSiguienteFecha(DateTime actual, Frecuencia frecuencia) =>
        frecuencia switch
        {
            Frecuencia.Semanal => actual.AddDays(7),
            Frecuencia.Quincenal => actual.AddDays(15),
            _ => actual.AddMonths(1)
        };

    public async Task<List<GastoRecurrente>> ProximosPagosAsync()
    {
        await _db.InicializarAsync();
        return await _db.Connection.Table<GastoRecurrente>()
            .Where(g => g.Activo)
            .OrderBy(g => g.ProximaFecha)
            .ToListAsync();
    }

    /// <summary>Registra el pago como movimiento y avanza la próxima fecha.</summary>
    public async Task<Movimiento> RegistrarPagoAsync(GastoRecurrente recurrente, DateTime? fecha = null)
    {
        await _db.InicializarAsync();
        var movimiento = new Movimiento
        {
            Monto = recurrente.Monto,
            Tipo = TipoMovimiento.Gasto,
            CategoriaId = recurrente.CategoriaId,
            CuentaId = recurrente.CuentaId,
            Fecha = fecha ?? DateTime.Now,
            Nota = recurrente.Nombre
        };
        await _db.Connection.InsertAsync(movimiento);

        recurrente.ProximaFecha = CalcularSiguienteFecha(recurrente.ProximaFecha, recurrente.Frecuencia);
        await _db.Connection.UpdateAsync(recurrente);
        return movimiento;
    }
}
