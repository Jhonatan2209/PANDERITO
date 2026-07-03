using Chanchito.Core.Models;
using Chanchito.Core.Services;

namespace Chanchito.Tests;

public class ServicioMovimientosTests
{
    [Fact]
    public async Task GastosPorCategoria_AgrupaYOrdena()
    {
        await using var bd = new BaseDeDatosTemporal();
        await bd.Db.InicializarAsync();
        var conn = bd.Db.Connection;
        var julio = new DateTime(2026, 7, 5);

        await conn.InsertAsync(new Movimiento { Tipo = TipoMovimiento.Gasto, Monto = 100m, CategoriaId = 1, CuentaId = 1, Fecha = julio });
        await conn.InsertAsync(new Movimiento { Tipo = TipoMovimiento.Gasto, Monto = 50m, CategoriaId = 1, CuentaId = 1, Fecha = julio });
        await conn.InsertAsync(new Movimiento { Tipo = TipoMovimiento.Gasto, Monto = 300m, CategoriaId = 2, CuentaId = 1, Fecha = julio });

        var servicio = new ServicioMovimientos(bd.Db);
        var gastos = await servicio.GastosPorCategoriaAsync(2026, 7);

        Assert.Equal(2, gastos.Count);
        Assert.Equal(2, gastos[0].CategoriaId);   // 300 primero (descendente)
        Assert.Equal(300m, gastos[0].Total);
        Assert.Equal(150m, gastos[1].Total);
        Assert.Equal("Transporte", gastos[0].Nombre); // seed: categoría 2
    }

    [Fact]
    public async Task Buscar_FiltraPorTipoFechaYTexto()
    {
        await using var bd = new BaseDeDatosTemporal();
        await bd.Db.InicializarAsync();
        var conn = bd.Db.Connection;
        var julio = new DateTime(2026, 7, 10);

        await conn.InsertAsync(new Movimiento { Tipo = TipoMovimiento.Gasto, Monto = 12.5m, CategoriaId = 1, CuentaId = 1, Fecha = julio, Nota = "menú del día" });
        await conn.InsertAsync(new Movimiento { Tipo = TipoMovimiento.Gasto, Monto = 20m, CategoriaId = 2, CuentaId = 1, Fecha = julio, Nota = "taxi" });
        await conn.InsertAsync(new Movimiento { Tipo = TipoMovimiento.Ingreso, Monto = 1000m, CategoriaId = 8, CuentaId = 1, Fecha = julio, Nota = "sueldo" });
        await conn.InsertAsync(new Movimiento { Tipo = TipoMovimiento.Gasto, Monto = 15m, CategoriaId = 1, CuentaId = 1, Fecha = julio.AddMonths(-2), Nota = "menú antiguo" });

        var servicio = new ServicioMovimientos(bd.Db);

        var soloGastos = await servicio.BuscarAsync(new FiltroMovimientos(Tipo: TipoMovimiento.Gasto));
        Assert.Equal(3, soloGastos.Count);

        var deJulio = await servicio.BuscarAsync(new FiltroMovimientos(Desde: new DateTime(2026, 7, 1), Hasta: new DateTime(2026, 7, 31)));
        Assert.Equal(3, deJulio.Count);

        var conMenu = await servicio.BuscarAsync(new FiltroMovimientos(TextoBusqueda: "menú"));
        Assert.Equal(2, conMenu.Count);

        var combinado = await servicio.BuscarAsync(new FiltroMovimientos(
            Desde: new DateTime(2026, 7, 1), Tipo: TipoMovimiento.Gasto, TextoBusqueda: "menú"));
        Assert.Single(combinado);
        Assert.Equal(12.5m, combinado[0].Monto);
    }

    [Fact]
    public async Task TendenciaMensual_DevuelveNMesesEnOrden()
    {
        await using var bd = new BaseDeDatosTemporal();
        await bd.Db.InicializarAsync();
        var conn = bd.Db.Connection;
        var referencia = new DateTime(2026, 7, 15);

        await conn.InsertAsync(new Movimiento { Tipo = TipoMovimiento.Gasto, Monto = 100m, CategoriaId = 1, CuentaId = 1, Fecha = new DateTime(2026, 7, 2) });
        await conn.InsertAsync(new Movimiento { Tipo = TipoMovimiento.Gasto, Monto = 200m, CategoriaId = 1, CuentaId = 1, Fecha = new DateTime(2026, 6, 20) });
        await conn.InsertAsync(new Movimiento { Tipo = TipoMovimiento.Gasto, Monto = 999m, CategoriaId = 1, CuentaId = 1, Fecha = new DateTime(2026, 1, 5) }); // fuera de rango

        var servicio = new ServicioMovimientos(bd.Db);
        var tendencia = await servicio.TendenciaMensualAsync(3, referencia);

        Assert.Equal(3, tendencia.Count);
        Assert.Equal((2026, 5, 0m), tendencia[0]);
        Assert.Equal((2026, 6, 200m), tendencia[1]);
        Assert.Equal((2026, 7, 100m), tendencia[2]);
    }

    [Fact]
    public void SiguienteFechaRecurrente()
    {
        var fecha = new DateTime(2026, 7, 10);
        Assert.Equal(new DateTime(2026, 7, 17), ServicioRecurrentes.CalcularSiguienteFecha(fecha, Frecuencia.Semanal));
        Assert.Equal(new DateTime(2026, 7, 25), ServicioRecurrentes.CalcularSiguienteFecha(fecha, Frecuencia.Quincenal));
        Assert.Equal(new DateTime(2026, 8, 10), ServicioRecurrentes.CalcularSiguienteFecha(fecha, Frecuencia.Mensual));
    }
}
