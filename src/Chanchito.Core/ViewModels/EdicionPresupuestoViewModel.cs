using System.Collections.ObjectModel;
using System.Globalization;
using Chanchito.Core.Data;
using Chanchito.Core.Models;
using Chanchito.Core.Services;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace Chanchito.Core.ViewModels;

public partial class EdicionPresupuestoViewModel : BaseViewModel
{
    private readonly ChanchitoDatabase _db;
    private readonly INavegador _navegador;
    private Presupuesto? _presupuesto;

    public IReadOnlyList<string> Periodos { get; } =
        Enum.GetValues<Frecuencia>().Select(EtiquetasDominio.DeFrecuencia).ToList();

    public ObservableCollection<Categoria> Categorias { get; } = new();

    [ObservableProperty] private Categoria? _categoriaSeleccionada;
    [ObservableProperty] private string _montoLimiteTexto = string.Empty;
    [ObservableProperty] private int _indicePeriodo = (int)Frecuencia.Mensual;
    [ObservableProperty] private bool _esEdicion;

    public EdicionPresupuestoViewModel(ChanchitoDatabase db, INavegador navegador)
    {
        _db = db;
        _navegador = navegador;
        Titulo = "Presupuesto";
    }

    public async Task CargarAsync(int id)
    {
        await _db.InicializarAsync();

        if (Categorias.Count == 0)
        {
            var categorias = await _db.Connection.Table<Categoria>()
                .Where(c => c.TipoMovimiento == TipoMovimiento.Gasto).ToListAsync();
            foreach (var c in categorias) Categorias.Add(c);
        }

        if (id == 0)
        {
            _presupuesto = null;
            EsEdicion = false;
            CategoriaSeleccionada = Categorias.FirstOrDefault();
            MontoLimiteTexto = string.Empty;
            IndicePeriodo = (int)Frecuencia.Mensual;
            return;
        }

        _presupuesto = await _db.Connection.FindAsync<Presupuesto>(id);
        if (_presupuesto is null) return;
        EsEdicion = true;
        CategoriaSeleccionada = Categorias.FirstOrDefault(c => c.Id == _presupuesto.CategoriaId);
        MontoLimiteTexto = _presupuesto.MontoLimite.ToString(FormatoMoneda.CulturaPeru);
        IndicePeriodo = (int)_presupuesto.Periodo;
    }

    [RelayCommand]
    private async Task GuardarAsync()
    {
        if (CategoriaSeleccionada is null)
        {
            await _navegador.AlertaAsync("Falta la categoría", "Elige una categoría de gasto.");
            return;
        }
        if (!decimal.TryParse(MontoLimiteTexto, NumberStyles.Number, FormatoMoneda.CulturaPeru, out var limite) || limite <= 0)
        {
            await _navegador.AlertaAsync("Límite inválido", "Ingresa un límite mayor a cero.");
            return;
        }

        try
        {
            // Evitar dos presupuestos para la misma categoría
            var existentes = await _db.Connection.Table<Presupuesto>()
                .Where(p => p.CategoriaId == CategoriaSeleccionada.Id).ToListAsync();
            if (existentes.Any(p => p.Id != (_presupuesto?.Id ?? 0)))
            {
                await _navegador.AlertaAsync("Ya existe", "Esa categoría ya tiene un presupuesto. Edítalo desde la lista.");
                return;
            }

            var presupuesto = _presupuesto ?? new Presupuesto();
            presupuesto.CategoriaId = CategoriaSeleccionada.Id;
            presupuesto.MontoLimite = limite;
            presupuesto.Periodo = (Frecuencia)IndicePeriodo;

            if (presupuesto.Id == 0) await _db.Connection.InsertAsync(presupuesto);
            else await _db.Connection.UpdateAsync(presupuesto);

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
        if (_presupuesto is null) return;
        if (!await _navegador.ConfirmarAsync("Eliminar presupuesto", "¿Eliminar este presupuesto?", "Eliminar")) return;

        try
        {
            await _db.Connection.DeleteAsync(_presupuesto);
            await _navegador.VolverAsync();
        }
        catch (Exception ex)
        {
            await _navegador.AlertaAsync("Error", $"No se pudo eliminar: {ex.Message}");
        }
    }
}
