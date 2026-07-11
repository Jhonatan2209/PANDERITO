using System.Collections.ObjectModel;
using Panderito.Core.Data;
using Panderito.Core.Models;
using Panderito.Core.Services;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace Panderito.Core.ViewModels;

public partial class HistorialViewModel : BaseViewModel
{
    private readonly PanderitoDatabase _db;
    private readonly ServicioMovimientos _movimientos;
    private readonly INavegador _navegador;

    // Filtro de tipo: 0 = Todos, 1 = Gastos, 2 = Ingresos
    [ObservableProperty] private int _indiceTipo;
    [ObservableProperty] private string _textoBusqueda = string.Empty;
    [ObservableProperty] private Categoria? _categoriaFiltro;
    [ObservableProperty] private Cuenta? _cuentaFiltro;
    [ObservableProperty] private bool _hayResultados = true;

    public ObservableCollection<MovimientoDetalle> Movimientos { get; } = new();
    public ObservableCollection<Categoria> Categorias { get; } = new();
    public ObservableCollection<Cuenta> Cuentas { get; } = new();

    public HistorialViewModel(PanderitoDatabase db, ServicioMovimientos movimientos, INavegador navegador)
    {
        _db = db;
        _movimientos = movimientos;
        _navegador = navegador;
        Titulo = "Movimientos";
    }

    partial void OnIndiceTipoChanged(int value) => _ = BuscarAsync();
    partial void OnTextoBusquedaChanged(string value) => _ = BuscarAsync();
    partial void OnCategoriaFiltroChanged(Categoria? value) => _ = BuscarAsync();
    partial void OnCuentaFiltroChanged(Cuenta? value) => _ = BuscarAsync();

    [RelayCommand]
    public async Task CargarAsync()
    {
        try
        {
            await _db.InicializarAsync();

            if (Categorias.Count == 0)
            {
                foreach (var c in await _db.Connection.Table<Categoria>().ToListAsync())
                    Categorias.Add(c);
                foreach (var c in await _db.Connection.Table<Cuenta>().ToListAsync())
                    Cuentas.Add(c);
            }
            await BuscarAsync();
        }
        catch (Exception ex)
        {
            await _navegador.AlertaAsync("Error", $"No se pudo cargar el historial: {ex.Message}");
        }
    }

    [RelayCommand]
    public async Task BuscarAsync()
    {
        try
        {
            var filtro = new FiltroMovimientos(
                CategoriaId: CategoriaFiltro?.Id,
                CuentaId: CuentaFiltro?.Id,
                Tipo: IndiceTipo switch
                {
                    1 => TipoMovimiento.Gasto,
                    2 => TipoMovimiento.Ingreso,
                    _ => null
                },
                TextoBusqueda: string.IsNullOrWhiteSpace(TextoBusqueda) ? null : TextoBusqueda);

            var resultado = await _movimientos.BuscarConDetalleAsync(filtro);
            Movimientos.Clear();
            foreach (var m in resultado) Movimientos.Add(m);
            HayResultados = Movimientos.Count > 0;
        }
        catch
        {
            HayResultados = false;
        }
    }

    [RelayCommand]
    private void FiltrarGastos() => IndiceTipo = 1;

    [RelayCommand]
    private void FiltrarIngresos() => IndiceTipo = 2;

    [RelayCommand]
    private void LimpiarFiltros()
    {
        CategoriaFiltro = null;
        CuentaFiltro = null;
        TextoBusqueda = string.Empty;
        IndiceTipo = 0;
    }

    [RelayCommand]
    private Task AbrirDetalleAsync(MovimientoDetalle detalle) =>
        _navegador.IrAAsync("detalleMovimiento", new Dictionary<string, object>
        {
            ["id"] = detalle.Movimiento.Id
        });
}
