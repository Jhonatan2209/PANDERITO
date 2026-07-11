using System.Collections.ObjectModel;
using Panderito.Core.Data;
using Panderito.Core.Models;
using Panderito.Core.Services;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace Panderito.Core.ViewModels;

public partial class TurnoItem : ObservableObject
{
    public TurnoPandero Turno { get; }
    public bool EsMiTurno { get; }

    [ObservableProperty] private bool _cobrado;

    public TurnoItem(TurnoPandero turno, bool esMiTurno)
    {
        Turno = turno;
        EsMiTurno = esMiTurno;
        _cobrado = turno.Cobrado;
    }

    public string NumeroTexto => Turno.NumeroTurno.ToString();
    public string Nombre => Turno.NombreParticipante;
    public string FechaTexto
    {
        get
        {
            var mes = Turno.FechaCobro.ToString("MMMM yyyy", FormatoMoneda.CulturaPeru);
            return char.ToUpper(mes[0]) + mes[1..];
        }
    }
}

public partial class DetallePanderoViewModel : BaseViewModel
{
    private readonly PanderitoDatabase _db;
    private readonly ServicioPanderos _panderos;
    private readonly INavegador _navegador;

    [ObservableProperty] private Pandero? _pandero;
    [ObservableProperty] private string _nombreTexto = string.Empty;
    [ObservableProperty] private string _miTurnoGrande = string.Empty;
    [ObservableProperty] private string _aportadoTexto = "S/ 0.00";
    [ObservableProperty] private string _cuotasTexto = string.Empty;
    [ObservableProperty] private string _recibireTexto = "S/ 0.00";
    [ObservableProperty] private string _detallePozoTexto = string.Empty;
    [ObservableProperty] private string _avanceTexto = string.Empty;
    [ObservableProperty] private double _avance;

    public ObservableCollection<TurnoItem> Turnos { get; } = new();

    public DetallePanderoViewModel(PanderitoDatabase db, ServicioPanderos panderos, INavegador navegador)
    {
        _db = db;
        _panderos = panderos;
        _navegador = navegador;
        Titulo = "Pandero";
    }

    public async Task CargarAsync(int id)
    {
        try
        {
            await _db.InicializarAsync();
            Pandero = await _db.Connection.FindAsync<Pandero>(id);
            if (Pandero is null)
            {
                await _navegador.VolverAsync();
                return;
            }
            await RefrescarAsync();
        }
        catch (Exception ex)
        {
            await _navegador.AlertaAsync("Error", $"No se pudo cargar: {ex.Message}");
        }
    }

    private async Task RefrescarAsync()
    {
        if (Pandero is null) return;
        var turnos = await _panderos.ObtenerTurnosAsync(Pandero.Id);
        var resumen = ServicioPanderos.CalcularResumen(Pandero, turnos);

        NombreTexto = Pandero.Nombre;
        MiTurnoGrande = resumen.FechaMiTurno is { } fecha
            ? $"{Capitalizar(fecha.ToString("MMMM yyyy", FormatoMoneda.CulturaPeru))} · Turno {Pandero.MiTurno}"
            : $"Turno {Pandero.MiTurno}";
        AportadoTexto = FormatoMoneda.EnSoles(resumen.Aportado);
        CuotasTexto = $"{resumen.CuotasPagadas} de {resumen.TotalTurnos} cuotas";
        RecibireTexto = FormatoMoneda.EnSoles(resumen.MontoARecibir);
        DetallePozoTexto = $"{Pandero.NumParticipantes} × {FormatoMoneda.EnSoles(Pandero.CuotaMonto)}";
        AvanceTexto = $"{resumen.TurnosCobrados} / {resumen.TotalTurnos}";
        Avance = resumen.TotalTurnos == 0 ? 0 : (double)resumen.TurnosCobrados / resumen.TotalTurnos;

        Turnos.Clear();
        foreach (var turno in turnos)
            Turnos.Add(new TurnoItem(turno, turno.NumeroTurno == Pandero.MiTurno));
    }

    private static string Capitalizar(string texto) =>
        string.IsNullOrEmpty(texto) ? texto : char.ToUpper(texto[0]) + texto[1..];

    [RelayCommand]
    private async Task AlternarCobradoAsync(TurnoItem item)
    {
        try
        {
            await _panderos.MarcarCobradoAsync(item.Turno, !item.Turno.Cobrado);
            item.Cobrado = item.Turno.Cobrado;
            await RefrescarAsync();
        }
        catch (Exception ex)
        {
            await _navegador.AlertaAsync("Error", $"No se pudo actualizar el turno: {ex.Message}");
        }
    }

    [RelayCommand]
    private async Task EliminarAsync()
    {
        if (Pandero is null) return;
        if (!await _navegador.ConfirmarAsync("Eliminar pandero",
                "Se eliminará el pandero y sus turnos. ¿Continuar?", "Eliminar")) return;

        try
        {
            var turnos = await _panderos.ObtenerTurnosAsync(Pandero.Id);
            foreach (var turno in turnos)
                await _db.Connection.DeleteAsync(turno);
            await _db.Connection.DeleteAsync(Pandero);
            await _navegador.VolverAsync();
        }
        catch (Exception ex)
        {
            await _navegador.AlertaAsync("Error", $"No se pudo eliminar: {ex.Message}");
        }
    }
}
