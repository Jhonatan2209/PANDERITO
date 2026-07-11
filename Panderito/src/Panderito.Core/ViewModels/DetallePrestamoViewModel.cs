using System.Collections.ObjectModel;
using System.Globalization;
using Panderito.Core.Data;
using Panderito.Core.Models;
using Panderito.Core.Services;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace Panderito.Core.ViewModels;

public record AbonoItem(AbonoPrestamo Abono)
{
    public string MontoTexto => FormatoMoneda.EnSoles(Abono.Monto);
    public string FechaTexto => Abono.Fecha.ToString("dd/MM/yyyy");
}

public partial class DetallePrestamoViewModel : BaseViewModel
{
    private readonly PanderitoDatabase _db;
    private readonly ServicioPrestamos _prestamos;
    private readonly INavegador _navegador;

    [ObservableProperty] private Prestamo? _prestamo;
    [ObservableProperty] private string _personaTexto = string.Empty;
    [ObservableProperty] private string _montoTexto = "S/ 0.00";
    [ObservableProperty] private string _abonadoTexto = "S/ 0.00";
    [ObservableProperty] private string _pendienteTexto = "S/ 0.00";
    [ObservableProperty] private string _estadoTexto = "Pendiente";
    [ObservableProperty] private string _tipoTexto = string.Empty;
    [ObservableProperty] private double _avance;
    [ObservableProperty] private bool _estaPagado;
    [ObservableProperty] private string _montoAbonoTexto = string.Empty;

    public ObservableCollection<AbonoItem> Abonos { get; } = new();

    public DetallePrestamoViewModel(PanderitoDatabase db, ServicioPrestamos prestamos, INavegador navegador)
    {
        _db = db;
        _prestamos = prestamos;
        _navegador = navegador;
        Titulo = "Préstamo";
    }

    public async Task CargarAsync(int id)
    {
        try
        {
            await _db.InicializarAsync();
            Prestamo = await _db.Connection.FindAsync<Prestamo>(id);
            if (Prestamo is null)
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
        if (Prestamo is null) return;
        var abonado = await _prestamos.TotalAbonadoAsync(Prestamo.Id);

        PersonaTexto = Prestamo.Persona;
        TipoTexto = Prestamo.Tipo == TipoPrestamo.PorCobrar ? "Me debe" : "Le debo";
        MontoTexto = FormatoMoneda.EnSoles(Prestamo.Monto);
        AbonadoTexto = FormatoMoneda.EnSoles(abonado);
        PendienteTexto = FormatoMoneda.EnSoles(Prestamo.Monto - abonado);
        EstadoTexto = Prestamo.Estado switch
        {
            EstadoPrestamo.Pagado => "Pagado",
            EstadoPrestamo.Parcial => "Parcial",
            _ => "Pendiente"
        };
        EstaPagado = Prestamo.Estado == EstadoPrestamo.Pagado;
        Avance = Prestamo.Monto <= 0 ? 0 : Math.Min(1, (double)(abonado / Prestamo.Monto));

        Abonos.Clear();
        foreach (var abono in await _prestamos.ObtenerAbonosAsync(Prestamo.Id))
            Abonos.Add(new AbonoItem(abono));
    }

    [RelayCommand]
    private async Task RegistrarAbonoAsync()
    {
        if (Prestamo is null) return;
        if (!decimal.TryParse(MontoAbonoTexto, NumberStyles.Number, FormatoMoneda.CulturaPeru, out var monto) || monto <= 0)
        {
            await _navegador.AlertaAsync("Monto inválido", "Ingresa un abono mayor a cero.");
            return;
        }

        try
        {
            await _prestamos.RegistrarAbonoAsync(Prestamo, monto);
            MontoAbonoTexto = string.Empty;
            await RefrescarAsync();
        }
        catch (Exception ex)
        {
            await _navegador.AlertaAsync("Error", $"No se pudo registrar el abono: {ex.Message}");
        }
    }

    [RelayCommand]
    private async Task MarcarPagadoAsync()
    {
        if (Prestamo is null || EstaPagado) return;
        if (!await _navegador.ConfirmarAsync("Marcar como pagado",
                $"Se registrará un abono por {PendienteTexto}. ¿Continuar?", "Sí, pagado")) return;

        try
        {
            await _prestamos.MarcarPagadoAsync(Prestamo);
            await RefrescarAsync();
        }
        catch (Exception ex)
        {
            await _navegador.AlertaAsync("Error", $"No se pudo actualizar: {ex.Message}");
        }
    }

    [RelayCommand]
    private async Task EliminarAsync()
    {
        if (Prestamo is null) return;
        if (!await _navegador.ConfirmarAsync("Eliminar préstamo",
                "Se eliminará el préstamo y sus abonos. ¿Continuar?", "Eliminar")) return;

        try
        {
            var abonos = await _prestamos.ObtenerAbonosAsync(Prestamo.Id);
            foreach (var abono in abonos)
                await _db.Connection.DeleteAsync(abono);
            await _db.Connection.DeleteAsync(Prestamo);
            await _navegador.VolverAsync();
        }
        catch (Exception ex)
        {
            await _navegador.AlertaAsync("Error", $"No se pudo eliminar: {ex.Message}");
        }
    }
}
