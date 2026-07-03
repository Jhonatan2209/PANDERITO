using Chanchito.Core.Models;
using Chanchito.Core.Services;

namespace Chanchito.Tests;

public class ServicioSaldosTests
{
    [Fact]
    public void Saldo_EsInicialMasIngresosMenosGastos()
    {
        var movimientos = new List<Movimiento>
        {
            new() { Tipo = TipoMovimiento.Ingreso, Monto = 1000m },
            new() { Tipo = TipoMovimiento.Gasto, Monto = 250.50m },
            new() { Tipo = TipoMovimiento.Gasto, Monto = 100m }
        };

        var saldo = ServicioSaldos.CalcularSaldo(500m, movimientos);

        Assert.Equal(1149.50m, saldo);
    }

    [Fact]
    public void Saldo_SinMovimientos_EsElInicial()
    {
        Assert.Equal(300m, ServicioSaldos.CalcularSaldo(300m, Array.Empty<Movimiento>()));
    }

    [Fact]
    public async Task SaldoTotal_SumaSoloCuentasActivas()
    {
        await using var bd = new BaseDeDatosTemporal();
        await bd.Db.InicializarAsync();
        var conn = bd.Db.Connection;

        // La BD sembrada ya tiene la cuenta "Efectivo" (saldo 0)
        var activa = new Cuenta { Nombre = "Yape", SaldoInicial = 100m, Activa = true };
        var inactiva = new Cuenta { Nombre = "Vieja", SaldoInicial = 999m, Activa = false };
        await conn.InsertAsync(activa);
        await conn.InsertAsync(inactiva);
        await conn.InsertAsync(new Movimiento { CuentaId = activa.Id, Tipo = TipoMovimiento.Ingreso, Monto = 50m, Fecha = DateTime.Now });
        await conn.InsertAsync(new Movimiento { CuentaId = activa.Id, Tipo = TipoMovimiento.Gasto, Monto = 30m, Fecha = DateTime.Now });

        var servicio = new ServicioSaldos(bd.Db);
        var total = await servicio.CalcularSaldoTotalAsync();

        Assert.Equal(120m, total); // 0 (Efectivo) + 100 + 50 − 30
    }

    [Fact]
    public async Task TotalesDelMes_SeparaIngresosYGastos()
    {
        await using var bd = new BaseDeDatosTemporal();
        await bd.Db.InicializarAsync();
        var conn = bd.Db.Connection;
        var hoy = new DateTime(2026, 7, 15);

        await conn.InsertAsync(new Movimiento { Tipo = TipoMovimiento.Ingreso, Monto = 2000m, Fecha = hoy, CuentaId = 1, CategoriaId = 8 });
        await conn.InsertAsync(new Movimiento { Tipo = TipoMovimiento.Gasto, Monto = 500m, Fecha = hoy, CuentaId = 1, CategoriaId = 1 });
        await conn.InsertAsync(new Movimiento { Tipo = TipoMovimiento.Gasto, Monto = 999m, Fecha = hoy.AddMonths(-1), CuentaId = 1, CategoriaId = 1 }); // mes anterior: fuera

        var servicio = new ServicioSaldos(bd.Db);
        var (ingresos, gastos) = await servicio.TotalesDelMesAsync(2026, 7);

        Assert.Equal(2000m, ingresos);
        Assert.Equal(500m, gastos);
    }
}
