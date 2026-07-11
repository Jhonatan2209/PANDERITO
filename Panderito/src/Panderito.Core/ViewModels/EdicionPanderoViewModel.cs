using System.Globalization;
using Panderito.Core.Data;
using Panderito.Core.Models;
using Panderito.Core.Services;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace Panderito.Core.ViewModels;

public partial class EdicionPanderoViewModel : BaseViewModel
{
    private readonly ServicioPanderos _panderos;
    private readonly INavegador _navegador;

    public IReadOnlyList<string> Frecuencias { get; } =
        Enum.GetValues<Frecuencia>().Select(EtiquetasDominio.DeFrecuencia).ToList();

    [ObservableProperty] private string _nombre = string.Empty;
    [ObservableProperty] private string _numParticipantesTexto = string.Empty;
    [ObservableProperty] private string _cuotaTexto = string.Empty;
    [ObservableProperty] private int _indiceFrecuencia = (int)Frecuencia.Mensual;
    [ObservableProperty] private DateTime _fechaInicio = DateTime.Today;
    [ObservableProperty] private string _miTurnoTexto = "1";

    public EdicionPanderoViewModel(ServicioPanderos panderos, INavegador navegador)
    {
        _panderos = panderos;
        _navegador = navegador;
        Titulo = "Nuevo pandero";
    }

    public void Preparar()
    {
        Nombre = string.Empty;
        NumParticipantesTexto = string.Empty;
        CuotaTexto = string.Empty;
        IndiceFrecuencia = (int)Frecuencia.Mensual;
        FechaInicio = DateTime.Today;
        MiTurnoTexto = "1";
    }

    [RelayCommand]
    private async Task GuardarAsync()
    {
        if (string.IsNullOrWhiteSpace(Nombre))
        {
            await _navegador.AlertaAsync("Falta el nombre", "Ponle un nombre al pandero.");
            return;
        }
        if (!int.TryParse(NumParticipantesTexto, out var participantes) || participantes < 2)
        {
            await _navegador.AlertaAsync("Participantes inválidos", "Deben ser al menos 2 participantes.");
            return;
        }
        if (!decimal.TryParse(CuotaTexto, NumberStyles.Number, FormatoMoneda.CulturaPeru, out var cuota) || cuota <= 0)
        {
            await _navegador.AlertaAsync("Cuota inválida", "Ingresa una cuota mayor a cero.");
            return;
        }
        if (!int.TryParse(MiTurnoTexto, out var miTurno) || miTurno < 1 || miTurno > participantes)
        {
            await _navegador.AlertaAsync("Turno inválido", $"Tu turno debe estar entre 1 y {participantes}.");
            return;
        }

        try
        {
            await _panderos.CrearConTurnosAsync(new Pandero
            {
                Nombre = Nombre.Trim(),
                NumParticipantes = participantes,
                CuotaMonto = cuota,
                Frecuencia = (Frecuencia)IndiceFrecuencia,
                FechaInicio = FechaInicio,
                MiTurno = miTurno,
                Activo = true
            });
            await _navegador.VolverAsync();
        }
        catch (Exception ex)
        {
            await _navegador.AlertaAsync("Error", $"No se pudo crear el pandero: {ex.Message}");
        }
    }
}
