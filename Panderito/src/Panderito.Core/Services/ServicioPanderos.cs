using Panderito.Core.Data;
using Panderito.Core.Models;

namespace Panderito.Core.Services;

public record ResumenPandero(
    decimal Aportado,
    int CuotasPagadas,
    decimal MontoARecibir,
    DateTime? FechaMiTurno,
    int TurnosCobrados,
    int TotalTurnos);

/// <summary>Generación de turnos y cálculos de aportes de panderos (juntas).</summary>
public class ServicioPanderos
{
    private readonly PanderitoDatabase _db;

    public ServicioPanderos(PanderitoDatabase db)
    {
        _db = db;
    }

    /// <summary>Genera los N turnos del pandero con su fecha de cobro según la frecuencia.</summary>
    public static List<TurnoPandero> GenerarTurnos(Pandero pandero, IList<string>? nombres = null)
    {
        var turnos = new List<TurnoPandero>(pandero.NumParticipantes);
        for (var i = 0; i < pandero.NumParticipantes; i++)
        {
            var numero = i + 1;
            var nombre = nombres is not null && i < nombres.Count && !string.IsNullOrWhiteSpace(nombres[i])
                ? nombres[i]
                : numero == pandero.MiTurno ? "Yo" : $"Participante {numero}";
            turnos.Add(new TurnoPandero
            {
                PanderoId = pandero.Id,
                NumeroTurno = numero,
                NombreParticipante = nombre,
                FechaCobro = FechaDelTurno(pandero.FechaInicio, pandero.Frecuencia, i),
                Cobrado = false
            });
        }
        return turnos;
    }

    public static DateTime FechaDelTurno(DateTime fechaInicio, Frecuencia frecuencia, int indice) =>
        frecuencia switch
        {
            Frecuencia.Semanal => fechaInicio.AddDays(7 * indice),
            Frecuencia.Quincenal => fechaInicio.AddDays(15 * indice),
            _ => fechaInicio.AddMonths(indice)
        };

    /// <summary>Aportado = cuota × turnos ya cobrados; a recibir = cuota × participantes.</summary>
    public static ResumenPandero CalcularResumen(Pandero pandero, IEnumerable<TurnoPandero> turnos)
    {
        var lista = turnos.Where(t => t.PanderoId == pandero.Id).OrderBy(t => t.NumeroTurno).ToList();
        var cobrados = lista.Count(t => t.Cobrado);
        var miTurno = lista.FirstOrDefault(t => t.NumeroTurno == pandero.MiTurno);
        return new ResumenPandero(
            Aportado: pandero.CuotaMonto * cobrados,
            CuotasPagadas: cobrados,
            MontoARecibir: pandero.CuotaMonto * pandero.NumParticipantes,
            FechaMiTurno: miTurno?.FechaCobro,
            TurnosCobrados: cobrados,
            TotalTurnos: lista.Count);
    }

    /// <summary>Guarda el pandero y crea sus turnos en una sola operación.</summary>
    public async Task<Pandero> CrearConTurnosAsync(Pandero pandero, IList<string>? nombres = null)
    {
        await _db.InicializarAsync();
        await _db.Connection.InsertAsync(pandero);
        var turnos = GenerarTurnos(pandero, nombres);
        await _db.Connection.InsertAllAsync(turnos);
        return pandero;
    }

    public async Task<List<TurnoPandero>> ObtenerTurnosAsync(int panderoId)
    {
        await _db.InicializarAsync();
        return await _db.Connection.Table<TurnoPandero>()
            .Where(t => t.PanderoId == panderoId)
            .OrderBy(t => t.NumeroTurno)
            .ToListAsync();
    }

    public async Task MarcarCobradoAsync(TurnoPandero turno, bool cobrado = true)
    {
        await _db.InicializarAsync();
        turno.Cobrado = cobrado;
        await _db.Connection.UpdateAsync(turno);
    }
}
