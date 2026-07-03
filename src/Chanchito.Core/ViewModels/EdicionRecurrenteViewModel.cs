using System.Collections.ObjectModel;
using System.Globalization;
using Chanchito.Core.Data;
using Chanchito.Core.Models;
using Chanchito.Core.Services;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace Chanchito.Core.ViewModels;

public partial class EdicionRecurrenteViewModel : BaseViewModel
{
    private readonly ChanchitoDatabase _db;
    private readonly INavegador _navegador;
    private GastoRecurrente? _recurrente;

    public IReadOnlyList<string> Frecuencias { get; } =
        Enum.GetValues<Frecuencia>().Select(EtiquetasDominio.DeFrecuencia).ToList();

    public ObservableCollection<Categoria> Categorias { get; } = new();
    public ObservableCollection<Cuenta> Cuentas { get; } = new();

    [ObservableProperty] private string _nombre = string.Empty;
    [ObservableProperty] private string _montoTexto = string.Empty;
    [ObservableProperty] private Categoria? _categoriaSeleccionada;
    [ObservableProperty] private Cuenta? _cuentaSeleccionada;
    [ObservableProperty] private int _indiceFrecuencia = (int)Frecuencia.Mensual;
    [ObservableProperty] private DateTime _proximaFecha = DateTime.Today;
    [ObservableProperty] private bool _esEdicion;

    public EdicionRecurrenteViewModel(ChanchitoDatabase db, INavegador navegador)
    {
        _db = db;
        _navegador = navegador;
        Titulo = "Gasto recurrente";
    }

    public async Task CargarAsync(int id)
    {
        await _db.InicializarAsync();

        if (Categorias.Count == 0)
        {
            var categorias = await _db.Connection.Table<Categoria>()
                .Where(c => c.TipoMovimiento == TipoMovimiento.Gasto).ToListAsync();
            foreach (var c in categorias) Categorias.Add(c);
            var cuentas = await _db.Connection.Table<Cuenta>().Where(c => c.Activa).ToListAsync();
            foreach (var c in cuentas) Cuentas.Add(c);
        }

        if (id == 0)
        {
            _recurrente = null;
            EsEdicion = false;
            Nombre = string.Empty;
            MontoTexto = string.Empty;
            CategoriaSeleccionada = Categorias.FirstOrDefault(c => c.Nombre == "Servicios") ?? Categorias.FirstOrDefault();
            CuentaSeleccionada = Cuentas.FirstOrDefault();
            IndiceFrecuencia = (int)Frecuencia.Mensual;
            ProximaFecha = DateTime.Today;
            return;
        }

        _recurrente = await _db.Connection.FindAsync<GastoRecurrente>(id);
        if (_recurrente is null) return;
        EsEdicion = true;
        Nombre = _recurrente.Nombre;
        MontoTexto = _recurrente.Monto.ToString(FormatoMoneda.CulturaPeru);
        CategoriaSeleccionada = Categorias.FirstOrDefault(c => c.Id == _recurrente.CategoriaId);
        CuentaSeleccionada = Cuentas.FirstOrDefault(c => c.Id == _recurrente.CuentaId);
        IndiceFrecuencia = (int)_recurrente.Frecuencia;
        ProximaFecha = _recurrente.ProximaFecha;
    }

    [RelayCommand]
    private async Task GuardarAsync()
    {
        if (string.IsNullOrWhiteSpace(Nombre))
        {
            await _navegador.AlertaAsync("Falta el nombre", "Ej.: Internet, Luz, Netflix…");
            return;
        }
        if (!decimal.TryParse(MontoTexto, NumberStyles.Number, FormatoMoneda.CulturaPeru, out var monto) || monto <= 0)
        {
            await _navegador.AlertaAsync("Monto inválido", "Ingresa un monto mayor a cero.");
            return;
        }
        if (CategoriaSeleccionada is null || CuentaSeleccionada is null)
        {
            await _navegador.AlertaAsync("Faltan datos", "Elige categoría y cuenta.");
            return;
        }

        try
        {
            var recurrente = _recurrente ?? new GastoRecurrente();
            recurrente.Nombre = Nombre.Trim();
            recurrente.Monto = monto;
            recurrente.CategoriaId = CategoriaSeleccionada.Id;
            recurrente.CuentaId = CuentaSeleccionada.Id;
            recurrente.Frecuencia = (Frecuencia)IndiceFrecuencia;
            recurrente.ProximaFecha = ProximaFecha;
            recurrente.Activo = true;

            if (recurrente.Id == 0) await _db.Connection.InsertAsync(recurrente);
            else await _db.Connection.UpdateAsync(recurrente);

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
        if (_recurrente is null) return;
        if (!await _navegador.ConfirmarAsync("Eliminar recurrente", "¿Eliminar este gasto recurrente?", "Eliminar")) return;

        try
        {
            await _db.Connection.DeleteAsync(_recurrente);
            await _navegador.VolverAsync();
        }
        catch (Exception ex)
        {
            await _navegador.AlertaAsync("Error", $"No se pudo eliminar: {ex.Message}");
        }
    }
}
