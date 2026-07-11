using System.Collections.ObjectModel;
using Panderito.Core.Data;
using Panderito.Core.Models;
using Panderito.Core.Services;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace Panderito.Core.ViewModels;

public record PanderoItem(Pandero Pandero, ResumenPandero Resumen)
{
    public string CuotaTexto => $"{FormatoMoneda.EnSoles(Pandero.CuotaMonto)} · {EtiquetasDominio.DeFrecuencia(Pandero.Frecuencia)}";
    public string AvanceTexto => $"{Resumen.TurnosCobrados} / {Resumen.TotalTurnos}";
    public double Avance => Resumen.TotalTurnos == 0 ? 0 : (double)Resumen.TurnosCobrados / Resumen.TotalTurnos;
    public string MiTurnoTexto => Resumen.FechaMiTurno is { } f
        ? $"Mi turno: {f.ToString("MMMM yyyy", FormatoMoneda.CulturaPeru)} · Turno {Pandero.MiTurno}"
        : $"Turno {Pandero.MiTurno}";
}

public partial class PanderosViewModel : BaseViewModel
{
    private readonly PanderitoDatabase _db;
    private readonly ServicioPanderos _panderos;
    private readonly INavegador _navegador;

    [ObservableProperty] private bool _hayPanderos = true;

    public ObservableCollection<PanderoItem> Panderos { get; } = new();

    public PanderosViewModel(PanderitoDatabase db, ServicioPanderos panderos, INavegador navegador)
    {
        _db = db;
        _panderos = panderos;
        _navegador = navegador;
        Titulo = "Panderos";
    }

    [RelayCommand]
    public async Task CargarAsync()
    {
        try
        {
            await _db.InicializarAsync();
            var lista = await _db.Connection.Table<Pandero>()
                .Where(p => p.Activo)
                .OrderByDescending(p => p.FechaInicio)
                .ToListAsync();

            Panderos.Clear();
            foreach (var pandero in lista)
            {
                var turnos = await _panderos.ObtenerTurnosAsync(pandero.Id);
                Panderos.Add(new PanderoItem(pandero, ServicioPanderos.CalcularResumen(pandero, turnos)));
            }
            HayPanderos = Panderos.Count > 0;
        }
        catch (Exception ex)
        {
            await _navegador.AlertaAsync("Error", $"No se pudieron cargar los panderos: {ex.Message}");
        }
    }

    [RelayCommand]
    private Task NuevoAsync() => _navegador.IrAAsync("edicionPandero");

    [RelayCommand]
    private Task AbrirDetalleAsync(PanderoItem item) =>
        _navegador.IrAAsync("detallePandero", new Dictionary<string, object> { ["id"] = item.Pandero.Id });
}
