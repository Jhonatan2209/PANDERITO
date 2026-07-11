using Panderito.Core.Models;
using Panderito.Core.Services;

namespace Panderito.Tests;

public class ServicioExportacionTests
{
    [Fact]
    public void GenerarCsv_IncluyeCabeceraYFilas()
    {
        var movimientos = new List<Movimiento>
        {
            new() { Monto = 12.5m, Tipo = TipoMovimiento.Gasto, CategoriaId = 1, CuentaId = 1,
                    Fecha = new DateTime(2026, 7, 3, 13, 30, 0), Nota = "menú del día" },
            new() { Monto = 1000m, Tipo = TipoMovimiento.Ingreso, CategoriaId = 2, CuentaId = 1,
                    Fecha = new DateTime(2026, 7, 1, 9, 0, 0), Nota = "" }
        };
        var categorias = new List<Categoria>
        {
            new() { Id = 1, Nombre = "Menú/Comida" },
            new() { Id = 2, Nombre = "Sueldo" }
        };
        var cuentas = new List<Cuenta> { new() { Id = 1, Nombre = "Efectivo" } };

        var csv = ServicioExportacion.GenerarCsv(movimientos, categorias, cuentas);
        var lineas = csv.TrimEnd().Split(Environment.NewLine);

        Assert.Equal("Fecha,Tipo,Monto,Categoria,Cuenta,Nota", lineas[0]);
        Assert.Equal(3, lineas.Length);
        Assert.Contains("2026-07-03 13:30,Gasto,12.50,Menú/Comida,Efectivo,menú del día", lineas[1]);
        Assert.Contains("2026-07-01 09:00,Ingreso,1000.00,Sueldo,Efectivo,", lineas[2]);
    }

    [Fact]
    public void Escapar_ProtegeComasComillasYSaltos()
    {
        Assert.Equal("simple", ServicioExportacion.Escapar("simple"));
        Assert.Equal("\"con, coma\"", ServicioExportacion.Escapar("con, coma"));
        Assert.Equal("\"dijo \"\"hola\"\"\"", ServicioExportacion.Escapar("dijo \"hola\""));
        Assert.Equal(string.Empty, ServicioExportacion.Escapar(""));
    }

    [Fact]
    public async Task GenerarCsvDesdeBd_FuncionaConSeed()
    {
        await using var bd = new BaseDeDatosTemporal();
        await bd.Db.InicializarAsync();
        await bd.Db.Connection.InsertAsync(new Movimiento
        {
            Monto = 50m, Tipo = TipoMovimiento.Gasto, CategoriaId = 1, CuentaId = 1, Fecha = DateTime.Now, Nota = "taxi"
        });

        var servicio = new ServicioExportacion(bd.Db);
        var csv = await servicio.GenerarCsvMovimientosAsync();

        Assert.Contains("taxi", csv);
        Assert.Contains("50.00", csv);
    }
}
