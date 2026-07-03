using System.Collections.ObjectModel;
using Chanchito.Core.Data;
using Chanchito.Core.Models;
using Chanchito.Core.Services;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace Chanchito.Core.ViewModels;

public record RecurrenteItem(GastoRecurrente Recurrente)
{
    public string MontoTexto => FormatoMoneda.EnSoles(Recurrente.Monto);
    public string FrecuenciaTexto => EtiquetasDominio.DeFrecuencia(Recurrente.Frecuencia);
    public string ProximaFechaTexto => Recurrente.ProximaFecha.ToString("dd/MM/yyyy");
    public int DiasRestantes => (int)(Recurrente.ProximaFecha.Date - DateTime.Today).TotalDays;
    public string VenceTexto => DiasRestantes switch
    {
        < 0 => $"Venció hace {-DiasRestantes} día(s)",
        0 => "Vence hoy",
        1 => "Vence mañana",
        _ => $"En {DiasRestantes} días"
    };
    public bool EstaVencido => DiasRestantes <= 0;
}

public partial class RecurrentesViewModel : BaseViewModel
{
    private readonly ServicioRecurrentes _recurrentes;
    private readonly INavegador _navegador;

    [ObservableProperty] private bool _hayRecurrentes = true;

    public ObservableCollection<RecurrenteItem> Recurrentes { get; } = new();

    public RecurrentesViewModel(ServicioRecurrentes recurrentes, INavegador navegador)
    {
        _recurrentes = recurrentes;
        _navegador = navegador;
        Titulo = "Gastos recurrentes";
    }

    [RelayCommand]
    public async Task CargarAsync()
    {
        try
        {
            var lista = await _recurrentes.ProximosPagosAsync();
            Recurrentes.Clear();
            foreach (var r in lista) Recurrentes.Add(new RecurrenteItem(r));
            HayRecurrentes = Recurrentes.Count > 0;
        }
        catch (Exception ex)
        {
            await _navegador.AlertaAsync("Error", $"No se pudieron cargar los recurrentes: {ex.Message}");
        }
    }

    [RelayCommand]
    private async Task RegistrarPagoAsync(RecurrenteItem item)
    {
        if (!await _navegador.ConfirmarAsync("Registrar pago",
                $"Se registrará un gasto de {item.MontoTexto} por “{item.Recurrente.Nombre}”. ¿Continuar?",
                "Registrar")) return;

        try
        {
            await _recurrentes.RegistrarPagoAsync(item.Recurrente);
            await CargarAsync();
        }
        catch (Exception ex)
        {
            await _navegador.AlertaAsync("Error", $"No se pudo registrar el pago: {ex.Message}");
        }
    }

    [RelayCommand]
    private Task NuevoAsync() => _navegador.IrAAsync("edicionRecurrente");

    [RelayCommand]
    private Task EditarAsync(RecurrenteItem item) =>
        _navegador.IrAAsync("edicionRecurrente", new Dictionary<string, object> { ["id"] = item.Recurrente.Id });
}
