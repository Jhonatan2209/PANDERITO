using Chanchito.Core.Models;
using Chanchito.Core.Services;

namespace Chanchito.Tests;

public class ServicioPrestamosTests
{
    [Theory]
    [InlineData(100, 0, EstadoPrestamo.Pendiente)]
    [InlineData(100, 40, EstadoPrestamo.Parcial)]
    [InlineData(100, 100, EstadoPrestamo.Pagado)]
    [InlineData(100, 120, EstadoPrestamo.Pagado)]
    public void CalcularEstado(decimal monto, decimal abonado, EstadoPrestamo esperado)
    {
        Assert.Equal(esperado, ServicioPrestamos.CalcularEstado(monto, abonado));
    }

    [Fact]
    public async Task AbonoParcial_CambiaEstadoAParcial()
    {
        await using var bd = new BaseDeDatosTemporal();
        await bd.Db.InicializarAsync();
        var prestamo = new Prestamo { Persona = "Carlos", Monto = 300m, Tipo = TipoPrestamo.PorCobrar };
        await bd.Db.Connection.InsertAsync(prestamo);

        var servicio = new ServicioPrestamos(bd.Db);
        await servicio.RegistrarAbonoAsync(prestamo, 100m);

        var releido = await bd.Db.Connection.FindAsync<Prestamo>(prestamo.Id);
        Assert.Equal(EstadoPrestamo.Parcial, releido.Estado);
        Assert.Equal(200m, await servicio.SaldoPendienteAsync(releido));
    }

    [Fact]
    public async Task AbonosQueCompletanElMonto_CambianEstadoAPagado()
    {
        await using var bd = new BaseDeDatosTemporal();
        await bd.Db.InicializarAsync();
        var prestamo = new Prestamo { Persona = "María", Monto = 300m, Tipo = TipoPrestamo.PorPagar };
        await bd.Db.Connection.InsertAsync(prestamo);

        var servicio = new ServicioPrestamos(bd.Db);
        await servicio.RegistrarAbonoAsync(prestamo, 150m);
        await servicio.RegistrarAbonoAsync(prestamo, 150m);

        var releido = await bd.Db.Connection.FindAsync<Prestamo>(prestamo.Id);
        Assert.Equal(EstadoPrestamo.Pagado, releido.Estado);
        Assert.Equal(0m, await servicio.SaldoPendienteAsync(releido));
        Assert.Equal(2, (await servicio.ObtenerAbonosAsync(prestamo.Id)).Count);
    }

    [Fact]
    public async Task MarcarPagado_RegistraAbonoPorElRestante()
    {
        await using var bd = new BaseDeDatosTemporal();
        await bd.Db.InicializarAsync();
        var prestamo = new Prestamo { Persona = "Luis", Monto = 500m, Tipo = TipoPrestamo.PorCobrar };
        await bd.Db.Connection.InsertAsync(prestamo);

        var servicio = new ServicioPrestamos(bd.Db);
        await servicio.RegistrarAbonoAsync(prestamo, 200m);
        await servicio.MarcarPagadoAsync(prestamo);

        var releido = await bd.Db.Connection.FindAsync<Prestamo>(prestamo.Id);
        Assert.Equal(EstadoPrestamo.Pagado, releido.Estado);
        Assert.Equal(500m, await servicio.TotalAbonadoAsync(prestamo.Id));
    }
}
