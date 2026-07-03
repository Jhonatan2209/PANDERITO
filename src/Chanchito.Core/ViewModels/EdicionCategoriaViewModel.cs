using Chanchito.Core.Data;
using Chanchito.Core.Models;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace Chanchito.Core.ViewModels;

public partial class EdicionCategoriaViewModel : BaseViewModel
{
    private readonly ChanchitoDatabase _db;
    private readonly INavegador _navegador;
    private Categoria? _categoria;
    private TipoMovimiento _tipo = TipoMovimiento.Gasto;

    public IReadOnlyList<string> Iconos { get; } = new[]
    {
        "🍽️", "🚌", "🛒", "💡", "💊", "🎬", "📦", "💼", "🏷️", "🤝", "💰",
        "🏠", "📱", "🎓", "👕", "⛽", "🎁", "✈️", "🐷", "☕", "🍺", "💈"
    };

    public IReadOnlyList<string> Colores { get; } = new[]
    {
        "#F97316", "#3B82F6", "#10B981", "#EAB308", "#EF4444", "#8B5CF6",
        "#6B7280", "#22C55E", "#14B8A6", "#F59E0B", "#84CC16", "#EC4899"
    };

    [ObservableProperty] private string _nombre = string.Empty;
    [ObservableProperty] private string _iconoSeleccionado = "🏷️";
    [ObservableProperty] private string _colorSeleccionado = "#6C5CE7";
    [ObservableProperty] private bool _esEdicion;

    public EdicionCategoriaViewModel(ChanchitoDatabase db, INavegador navegador)
    {
        _db = db;
        _navegador = navegador;
        Titulo = "Categoría";
    }

    public async Task CargarAsync(int id, int indiceTipo)
    {
        await _db.InicializarAsync();
        if (id == 0)
        {
            _categoria = null;
            _tipo = indiceTipo == 0 ? TipoMovimiento.Gasto : TipoMovimiento.Ingreso;
            EsEdicion = false;
            Nombre = string.Empty;
            IconoSeleccionado = Iconos[8];
            ColorSeleccionado = Colores[0];
            return;
        }

        _categoria = await _db.Connection.FindAsync<Categoria>(id);
        if (_categoria is null) return;
        _tipo = _categoria.TipoMovimiento;
        EsEdicion = true;
        Nombre = _categoria.Nombre;
        IconoSeleccionado = _categoria.Icono;
        ColorSeleccionado = _categoria.ColorHex;
    }

    [RelayCommand]
    private void ElegirIcono(string icono) => IconoSeleccionado = icono;

    [RelayCommand]
    private void ElegirColor(string color) => ColorSeleccionado = color;

    [RelayCommand]
    private async Task GuardarAsync()
    {
        if (string.IsNullOrWhiteSpace(Nombre))
        {
            await _navegador.AlertaAsync("Falta el nombre", "Ponle un nombre a la categoría.");
            return;
        }

        try
        {
            var categoria = _categoria ?? new Categoria { TipoMovimiento = _tipo };
            categoria.Nombre = Nombre.Trim();
            categoria.Icono = IconoSeleccionado;
            categoria.ColorHex = ColorSeleccionado;

            if (categoria.Id == 0) await _db.Connection.InsertAsync(categoria);
            else await _db.Connection.UpdateAsync(categoria);

            await _navegador.VolverAsync();
        }
        catch (Exception ex)
        {
            await _navegador.AlertaAsync("Error", $"No se pudo guardar: {ex.Message}");
        }
    }

    [RelayCommand]
    private async Task EliminarAsync()
    {
        if (_categoria is null) return;
        var usos = await _db.Connection.Table<Movimiento>()
            .Where(m => m.CategoriaId == _categoria.Id).CountAsync();
        if (usos > 0)
        {
            await _navegador.AlertaAsync("No se puede eliminar",
                $"Esta categoría tiene {usos} movimientos. Edítala o crea otra.");
            return;
        }
        if (!await _navegador.ConfirmarAsync("Eliminar categoría", "¿Eliminar esta categoría?", "Eliminar")) return;

        try
        {
            await _db.Connection.DeleteAsync(_categoria);
            await _navegador.VolverAsync();
        }
        catch (Exception ex)
        {
            await _navegador.AlertaAsync("Error", $"No se pudo eliminar: {ex.Message}");
        }
    }
}
