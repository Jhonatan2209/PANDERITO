using Panderito.Core.Data;
using Panderito.Core.Models;

namespace Panderito.Core.Services;

/// <summary>Cálculo de saldos de cuentas y totales del mes.</summary>
public class ServicioSaldos
{
    private readonly PanderitoDatabase _db;

    public ServicioSaldos(PanderitoDatabase db)
    {
        _db = db;
    }

    /// <summary>Saldo = saldo inicial + ingresos − gastos (las transferencias quedan fuera del MVP).</summary>
    public static decimal CalcularSaldo(decimal saldoInicial, IEnumerable<Movimiento> movimientosDeLaCuenta)
    {
        var saldo = saldoInicial;
        foreach (var m in movimientosDeLaCuenta)
        {
            saldo += m.Tipo switch
            {
                TipoMovimiento.Ingreso => m.Monto,
                TipoMovimiento.Gasto => -m.Monto,
                _ => 0m
            };
        }
        return saldo;
    }

    public async Task<decimal> CalcularSaldoCuentaAsync(Cuenta cuenta)
    {
        await _db.InicializarAsync();
        var movimientos = await _db.Connection.Table<Movimiento>()
            .Where(m => m.CuentaId == cuenta.Id)
            .ToListAsync();
        return CalcularSaldo(cuenta.SaldoInicial, movimientos);
    }

    /// <summary>Suma de saldos de todas las cuentas activas.</summary>
    public async Task<decimal> CalcularSaldoTotalAsync()
    {
        await _db.InicializarAsync();
        var cuentas = await _db.Connection.Table<Cuenta>().Where(c => c.Activa).ToListAsync();
        var total = 0m;
        foreach (var cuenta in cuentas)
            total += await CalcularSaldoCuentaAsync(cuenta);
        return total;
    }

    /// <summary>Ingresos y gastos de un mes calendario.</summary>
    public async Task<(decimal Ingresos, decimal Gastos)> TotalesDelMesAsync(int anio, int mes)
    {
        await _db.InicializarAsync();
        var desde = new DateTime(anio, mes, 1);
        var hasta = desde.AddMonths(1);
        var movimientos = await _db.Connection.Table<Movimiento>()
            .Where(m => m.Fecha >= desde && m.Fecha < hasta)
            .ToListAsync();
        var ingresos = movimientos.Where(m => m.Tipo == TipoMovimiento.Ingreso).Sum(m => m.Monto);
        var gastos = movimientos.Where(m => m.Tipo == TipoMovimiento.Gasto).Sum(m => m.Monto);
        return (ingresos, gastos);
    }
}
