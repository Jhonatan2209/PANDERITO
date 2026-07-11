using Panderito.Core.Models;
using Panderito.Core.Services;

namespace Panderito.Tests;

public class ServicioPresupuestosTests
{
    [Theory]
    [InlineData(400, 100, NivelPresupuesto.Normal)]    // 25 %
    [InlineData(400, 319, NivelPresupuesto.Normal)]    // 79.75 %
    [InlineData(400, 320, NivelPresupuesto.Alerta)]    // 80 % exacto
    [InlineData(400, 399, NivelPresupuesto.Alerta)]    // 99.75 %
    [InlineData(400, 400, NivelPresupuesto.Excedido)]  // 100 % exacto
    [InlineData(400, 450, NivelPresupuesto.Excedido)]  // 112.5 %
    public void Umbrales80y100(decimal limite, decimal gastado, NivelPresupuesto esperado)
    {
        var avance = ServicioPresupuestos.CalcularAvance(limite, gastado);
        Assert.Equal(esperado, avance.Nivel);
    }

    [Fact]
    public void LimiteCero_NoDivideEntreCero()
    {
        var avance = ServicioPresupuestos.CalcularAvance(0m, 100m);
        Assert.Equal(0, avance.Porcentaje);
        Assert.Equal(NivelPresupuesto.Normal, avance.Nivel);
    }

    [Fact]
    public async Task AvanceMensual_SoloCuentaGastosDelMesYCategoria()
    {
        await using var bd = new BaseDeDatosTemporal();
        await bd.Db.InicializarAsync();
        var conn = bd.Db.Connection;
        var julio = new DateTime(2026, 7, 10);

        await conn.InsertAsync(new Movimiento { Tipo = TipoMovimiento.Gasto, Monto = 200m, CategoriaId = 1, CuentaId = 1, Fecha = julio });
        await conn.InsertAsync(new Movimiento { Tipo = TipoMovimiento.Gasto, Monto = 150m, CategoriaId = 1, CuentaId = 1, Fecha = julio.AddDays(3) });
        await conn.InsertAsync(new Movimiento { Tipo = TipoMovimiento.Gasto, Monto = 80m, CategoriaId = 2, CuentaId = 1, Fecha = julio });          // otra categoría
        await conn.InsertAsync(new Movimiento { Tipo = TipoMovimiento.Gasto, Monto = 500m, CategoriaId = 1, CuentaId = 1, Fecha = julio.AddMonths(-1) }); // otro mes
        await conn.InsertAsync(new Movimiento { Tipo = TipoMovimiento.Ingreso, Monto = 99m, CategoriaId = 1, CuentaId = 1, Fecha = julio });        // ingreso: no cuenta

        var servicio = new ServicioPresupuestos(bd.Db);
        var presupuesto = new Presupuesto { CategoriaId = 1, MontoLimite = 400m, Periodo = Frecuencia.Mensual };
        var avance = await servicio.CalcularAvanceAsync(presupuesto, julio);

        Assert.Equal(350m, avance.Gastado);
        Assert.Equal(NivelPresupuesto.Alerta, avance.Nivel); // 87.5 %
    }
}
