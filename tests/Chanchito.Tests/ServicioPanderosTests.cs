using Chanchito.Core.Models;
using Chanchito.Core.Services;

namespace Chanchito.Tests;

public class ServicioPanderosTests
{
    private static Pandero PanderoDePrueba() => new()
    {
        Id = 1,
        Nombre = "Pandero de la oficina",
        NumParticipantes = 10,
        CuotaMonto = 200m,
        Frecuencia = Frecuencia.Mensual,
        FechaInicio = new DateTime(2026, 1, 15),
        MiTurno = 4
    };

    [Fact]
    public void GenerarTurnos_CreaNTurnosConFechasMensuales()
    {
        var pandero = PanderoDePrueba();
        var turnos = ServicioPanderos.GenerarTurnos(pandero);

        Assert.Equal(10, turnos.Count);
        Assert.Equal(new DateTime(2026, 1, 15), turnos[0].FechaCobro);
        Assert.Equal(new DateTime(2026, 4, 15), turnos[3].FechaCobro); // mi turno (4) = abril
        Assert.Equal(new DateTime(2026, 10, 15), turnos[9].FechaCobro);
        Assert.All(turnos, t => Assert.False(t.Cobrado));
        Assert.Equal("Yo", turnos[3].NombreParticipante);
    }

    [Fact]
    public void GenerarTurnos_FrecuenciaSemanalYQuincenal()
    {
        var pandero = PanderoDePrueba();
        pandero.Frecuencia = Frecuencia.Semanal;
        var semanal = ServicioPanderos.GenerarTurnos(pandero);
        Assert.Equal(new DateTime(2026, 1, 22), semanal[1].FechaCobro);

        pandero.Frecuencia = Frecuencia.Quincenal;
        var quincenal = ServicioPanderos.GenerarTurnos(pandero);
        Assert.Equal(new DateTime(2026, 1, 30), quincenal[1].FechaCobro);
    }

    [Fact]
    public void GenerarTurnos_UsaNombresDados()
    {
        var pandero = PanderoDePrueba();
        var nombres = new[] { "Lucía Ramos", "Miguel Torres", "Rosa Díaz" };
        var turnos = ServicioPanderos.GenerarTurnos(pandero, nombres);

        Assert.Equal("Lucía Ramos", turnos[0].NombreParticipante);
        Assert.Equal("Miguel Torres", turnos[1].NombreParticipante);
        Assert.Equal("Yo", turnos[3].NombreParticipante);          // sin nombre y es mi turno
        Assert.Equal("Participante 5", turnos[4].NombreParticipante);
    }

    [Fact]
    public void Resumen_AportadoVsARecibir()
    {
        var pandero = PanderoDePrueba();
        var turnos = ServicioPanderos.GenerarTurnos(pandero);
        turnos[0].Cobrado = true;
        turnos[1].Cobrado = true;
        turnos[2].Cobrado = true;

        var resumen = ServicioPanderos.CalcularResumen(pandero, turnos);

        Assert.Equal(600m, resumen.Aportado);          // 3 cuotas × S/200
        Assert.Equal(3, resumen.CuotasPagadas);
        Assert.Equal(2000m, resumen.MontoARecibir);    // 10 × S/200
        Assert.Equal(new DateTime(2026, 4, 15), resumen.FechaMiTurno);
        Assert.Equal(10, resumen.TotalTurnos);
    }

    [Fact]
    public async Task CrearConTurnos_PersisteTodo()
    {
        await using var bd = new BaseDeDatosTemporal();
        var servicio = new ServicioPanderos(bd.Db);
        var pandero = PanderoDePrueba();
        pandero.Id = 0; // que lo asigne la BD

        await servicio.CrearConTurnosAsync(pandero);

        Assert.True(pandero.Id > 0);
        var turnos = await servicio.ObtenerTurnosAsync(pandero.Id);
        Assert.Equal(10, turnos.Count);

        await servicio.MarcarCobradoAsync(turnos[0]);
        var releidos = await servicio.ObtenerTurnosAsync(pandero.Id);
        Assert.True(releidos[0].Cobrado);
    }
}
