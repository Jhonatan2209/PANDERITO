using Chanchito.Core.Data;
using Chanchito.Core.Models;

namespace Chanchito.Core.Services;

/// <summary>Préstamos con abonos parciales y actualización automática de estado.</summary>
public class ServicioPrestamos
{
    private readonly ChanchitoDatabase _db;

    public ServicioPrestamos(ChanchitoDatabase db)
    {
        _db = db;
    }

    public static EstadoPrestamo CalcularEstado(decimal montoPrestamo, decimal totalAbonado)
    {
        if (totalAbonado <= 0) return EstadoPrestamo.Pendiente;
        if (totalAbonado >= montoPrestamo) return EstadoPrestamo.Pagado;
        return EstadoPrestamo.Parcial;
    }

    public async Task<decimal> TotalAbonadoAsync(int prestamoId)
    {
        await _db.InicializarAsync();
        var abonos = await _db.Connection.Table<AbonoPrestamo>()
            .Where(a => a.PrestamoId == prestamoId)
            .ToListAsync();
        return abonos.Sum(a => a.Monto);
    }

    public async Task<decimal> SaldoPendienteAsync(Prestamo prestamo) =>
        prestamo.Monto - await TotalAbonadoAsync(prestamo.Id);

    /// <summary>Registra un abono y recalcula el estado del préstamo.</summary>
    public async Task<Prestamo> RegistrarAbonoAsync(Prestamo prestamo, decimal monto, DateTime? fecha = null)
    {
        await _db.InicializarAsync();
        await _db.Connection.InsertAsync(new AbonoPrestamo
        {
            PrestamoId = prestamo.Id,
            Monto = monto,
            Fecha = fecha ?? DateTime.Now
        });
        var total = await TotalAbonadoAsync(prestamo.Id);
        prestamo.Estado = CalcularEstado(prestamo.Monto, total);
        await _db.Connection.UpdateAsync(prestamo);
        return prestamo;
    }

    /// <summary>Marca el préstamo como pagado registrando el abono por el saldo restante.</summary>
    public async Task<Prestamo> MarcarPagadoAsync(Prestamo prestamo)
    {
        var pendiente = await SaldoPendienteAsync(prestamo);
        if (pendiente > 0)
            return await RegistrarAbonoAsync(prestamo, pendiente);

        prestamo.Estado = EstadoPrestamo.Pagado;
        await _db.Connection.UpdateAsync(prestamo);
        return prestamo;
    }

    public async Task<List<AbonoPrestamo>> ObtenerAbonosAsync(int prestamoId)
    {
        await _db.InicializarAsync();
        return await _db.Connection.Table<AbonoPrestamo>()
            .Where(a => a.PrestamoId == prestamoId)
            .OrderByDescending(a => a.Fecha)
            .ToListAsync();
    }
}
