using System.Collections.ObjectModel;
using Panderito.Core.Services;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace Panderito.Core.ViewModels;

public partial class DashboardViewModel : BaseViewModel
{
    private readonly ServicioSaldos _saldos;
    private readonly ServicioMovimientos _movimientos;
    private readonly INavegador _navegador;

    [ObservableProperty] private string _mesActual = string.Empty;
    [ObservableProperty] private string _saldoTotalTexto = "S/ 0.00";
    [ObservableProperty] private string _ingresosMesTexto = "S/ 0.00";
    [ObservableProperty] private string _gastosMesTexto = "S/ 0.00";
    [ObservableProperty] private bool _hayMovimientos;

    public ObservableCollection<MovimientoDetalle> Recientes { get; } = new();

    public DashboardViewModel(ServicioSaldos saldos, ServicioMovimientos movimientos, INavegador navegador)
    {
        _saldos = saldos;
        _movimientos = movimientos;
        _navegador = navegador;
        Titulo = "Inicio";
    }

    [RelayCommand]
    public async Task CargarAsync()
    {
        if (EstaOcupado) return;
        try
        {
            EstaOcupado = true;
            var hoy = DateTime.Today;
            var mes = hoy.ToString("MMMM yyyy", FormatoMoneda.CulturaPeru);
            MesActual = char.ToUpper(mes[0]) + mes[1..];

            SaldoTotalTexto = FormatoMoneda.EnSoles(await _saldos.CalcularSaldoTotalAsync());

            var (ingresos, gastos) = await _saldos.TotalesDelMesAsync(hoy.Year, hoy.Month);
            IngresosMesTexto = FormatoMoneda.EnSoles(ingresos);
            GastosMesTexto = FormatoMoneda.EnSoles(gastos);

            Recientes.Clear();
            foreach (var m in await _movimientos.RecientesConDetalleAsync(8))
                Recientes.Add(m);
            HayMovimientos = Recientes.Count > 0;
        }
        catch (Exception ex)
        {
            await _navegador.AlertaAsync("Error", $"No se pudo cargar el inicio: {ex.Message}");
        }
        finally
        {
            EstaOcupado = false;
        }
    }

    [RelayCommand]
    private Task AbrirDetalleAsync(MovimientoDetalle detalle) =>
        _navegador.IrAAsync("detalleMovimiento", new Dictionary<string, object>
        {
            ["id"] = detalle.Movimiento.Id
        });

    [RelayCommand]
    private Task IrARegistrarAsync() => _navegador.IrAAsync("//registrar");
}
