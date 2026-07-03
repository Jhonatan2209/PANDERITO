using System.Collections.ObjectModel;
using Chanchito.Core.Data;
using Chanchito.Core.Models;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace Chanchito.Core.ViewModels;

public partial class CategoriasViewModel : BaseViewModel
{
    private readonly ChanchitoDatabase _db;
    private readonly INavegador _navegador;

    // 0 = Gastos, 1 = Ingresos
    [ObservableProperty] private int _indiceTipo;

    public ObservableCollection<Categoria> Categorias { get; } = new();

    public CategoriasViewModel(ChanchitoDatabase db, INavegador navegador)
    {
        _db = db;
        _navegador = navegador;
        Titulo = "Categorías";
    }

    partial void OnIndiceTipoChanged(int value) => _ = CargarAsync();

    [RelayCommand]
    public async Task CargarAsync()
    {
        try
        {
            await _db.InicializarAsync();
            var tipo = IndiceTipo == 0 ? TipoMovimiento.Gasto : TipoMovimiento.Ingreso;
            var lista = await _db.Connection.Table<Categoria>()
                .Where(c => c.TipoMovimiento == tipo)
                .ToListAsync();
            Categorias.Clear();
            foreach (var c in lista) Categorias.Add(c);
        }
        catch (Exception ex)
        {
            await _navegador.AlertaAsync("Error", $"No se pudieron cargar las categorías: {ex.Message}");
        }
    }

    [RelayCommand] private void VerGastos() => IndiceTipo = 0;
    [RelayCommand] private void VerIngresos() => IndiceTipo = 1;

    [RelayCommand]
    private Task NuevaAsync() =>
        _navegador.IrAAsync("edicionCategoria", new Dictionary<string, object> { ["tipo"] = IndiceTipo });

    [RelayCommand]
    private Task EditarAsync(Categoria categoria) =>
        _navegador.IrAAsync("edicionCategoria", new Dictionary<string, object> { ["id"] = categoria.Id });
}
