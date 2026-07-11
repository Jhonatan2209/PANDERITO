using System.Collections.ObjectModel;
using Panderito.Core.Data;
using Panderito.Core.Models;
using Panderito.Core.Services;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace Panderito.Core.ViewModels;

public record PrestamoResumen(Prestamo Prestamo, decimal Abonado)
{
    public decimal Pendiente => Prestamo.Monto - Abonado;
    public string MontoTexto => FormatoMoneda.EnSoles(Prestamo.Monto);
    public string PendienteTexto => FormatoMoneda.EnSoles(Pendiente);
    public string EstadoTexto => Prestamo.Estado switch
    {
        EstadoPrestamo.Pagado => "Pagado",
        EstadoPrestamo.Parcial => "Parcial",
        _ => "Pendiente"
    };
    public bool EstaPagado => Prestamo.Estado == EstadoPrestamo.Pagado;
    public string FechaTexto => Prestamo.Fecha.ToString("dd/MM/yyyy");
}

public partial class PrestamosViewModel : BaseViewModel
{
    private readonly PanderitoDatabase _db;
    private readonly ServicioPrestamos _prestamos;
    private readonly INavegador _navegador;

    // 0 = Me deben (PorCobrar), 1 = Debo (PorPagar)
    [ObservableProperty] private int _indiceTipo;
    [ObservableProperty] private string _totalTexto = "S/ 0.00";
    [ObservableProperty] private bool _hayPrestamos;

    public ObservableCollection<PrestamoResumen> Prestamos { get; } = new();

    public PrestamosViewModel(PanderitoDatabase db, ServicioPrestamos prestamos, INavegador navegador)
    {
        _db = db;
        _prestamos = prestamos;
        _navegador = navegador;
        Titulo = "Préstamos";
    }

    partial void OnIndiceTipoChanged(int value) => _ = CargarAsync();

    [RelayCommand]
    public async Task CargarAsync()
    {
        try
        {
            await _db.InicializarAsync();
            var tipo = IndiceTipo == 0 ? TipoPrestamo.PorCobrar : TipoPrestamo.PorPagar;
            var lista = await _db.Connection.Table<Prestamo>()
                .Where(p => p.Tipo == tipo)
                .OrderByDescending(p => p.Fecha)
                .ToListAsync();

            Prestamos.Clear();
            var totalPendiente = 0m;
            foreach (var p in lista)
            {
                var abonado = await _prestamos.TotalAbonadoAsync(p.Id);
                var resumen = new PrestamoResumen(p, abonado);
                Prestamos.Add(resumen);
                if (!resumen.EstaPagado) totalPendiente += resumen.Pendiente;
            }
            TotalTexto = FormatoMoneda.EnSoles(totalPendiente);
            HayPrestamos = Prestamos.Count > 0;
        }
        catch (Exception ex)
        {
            await _navegador.AlertaAsync("Error", $"No se pudieron cargar los préstamos: {ex.Message}");
        }
    }

    [RelayCommand] private void VerMeDeben() => IndiceTipo = 0;
    [RelayCommand] private void VerDebo() => IndiceTipo = 1;

    [RelayCommand]
    private Task NuevoAsync() =>
        _navegador.IrAAsync("edicionPrestamo", new Dictionary<string, object> { ["tipo"] = IndiceTipo });

    [RelayCommand]
    private Task AbrirDetalleAsync(PrestamoResumen item) =>
        _navegador.IrAAsync("detallePrestamo", new Dictionary<string, object> { ["id"] = item.Prestamo.Id });
}
