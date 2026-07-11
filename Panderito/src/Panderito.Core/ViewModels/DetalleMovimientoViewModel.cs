using Panderito.Core.Services;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace Panderito.Core.ViewModels;

public partial class DetalleMovimientoViewModel : BaseViewModel
{
    private readonly ServicioMovimientos _movimientos;
    private readonly INavegador _navegador;

    [ObservableProperty] private MovimientoDetalle? _detalle;

    public DetalleMovimientoViewModel(ServicioMovimientos movimientos, INavegador navegador)
    {
        _movimientos = movimientos;
        _navegador = navegador;
        Titulo = "Detalle";
    }

    public async Task CargarAsync(int id)
    {
        try
        {
            Detalle = await _movimientos.ObtenerDetalleAsync(id);
            if (Detalle is null)
            {
                await _navegador.AlertaAsync("No encontrado", "El movimiento ya no existe.");
                await _navegador.VolverAsync();
            }
        }
        catch (Exception ex)
        {
            await _navegador.AlertaAsync("Error", $"No se pudo cargar el detalle: {ex.Message}");
        }
    }

    [RelayCommand]
    private async Task EliminarAsync()
    {
        if (Detalle is null) return;
        var confirmado = await _navegador.ConfirmarAsync(
            "Eliminar movimiento",
            $"¿Eliminar {Detalle.MontoTexto} de {Detalle.NombreCategoria}?",
            "Eliminar");
        if (!confirmado) return;

        try
        {
            await _movimientos.EliminarAsync(Detalle.Movimiento);
            await _navegador.VolverAsync();
        }
        catch (Exception ex)
        {
            await _navegador.AlertaAsync("Error", $"No se pudo eliminar: {ex.Message}");
        }
    }
}
