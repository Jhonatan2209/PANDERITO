using System.Collections.ObjectModel;
using Chanchito.Core.Data;
using Chanchito.Core.Models;
using Chanchito.Core.Services;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace Chanchito.Core.ViewModels;

public record PresupuestoItem(Presupuesto Presupuesto, Categoria? Categoria, AvancePresupuesto Avance)
{
    public string NombreCategoria => Categoria?.Nombre ?? "Sin categoría";
    public string IconoCategoria => Categoria?.Icono ?? "🏷️";
    public string DetalleTexto => $"{FormatoMoneda.EnSoles(Avance.Gastado)} de {FormatoMoneda.EnSoles(Avance.Limite)}";
    public string PorcentajeTexto => $"{Avance.Porcentaje:0}%";
    public double Fraccion => Math.Min(1, Avance.Porcentaje / 100.0);
    public string PeriodoTexto => EtiquetasDominio.DeFrecuencia(Presupuesto.Periodo);
    public bool EnAlerta => Avance.Nivel == NivelPresupuesto.Alerta;
    public bool Excedido => Avance.Nivel == NivelPresupuesto.Excedido;
    public bool Normal => Avance.Nivel == NivelPresupuesto.Normal;
}

public partial class PresupuestosViewModel : BaseViewModel
{
    private readonly ChanchitoDatabase _db;
    private readonly ServicioPresupuestos _presupuestos;
    private readonly INavegador _navegador;

    [ObservableProperty] private bool _hayPresupuestos = true;

    public ObservableCollection<PresupuestoItem> Presupuestos { get; } = new();

    public PresupuestosViewModel(ChanchitoDatabase db, ServicioPresupuestos presupuestos, INavegador navegador)
    {
        _db = db;
        _presupuestos = presupuestos;
        _navegador = navegador;
        Titulo = "Presupuestos";
    }

    [RelayCommand]
    public async Task CargarAsync()
    {
        try
        {
            await _db.InicializarAsync();
            var lista = await _db.Connection.Table<Presupuesto>().ToListAsync();
            var categorias = await _db.Connection.Table<Categoria>().ToListAsync();

            Presupuestos.Clear();
            foreach (var presupuesto in lista)
            {
                var avance = await _presupuestos.CalcularAvanceAsync(presupuesto, DateTime.Today);
                var categoria = categorias.FirstOrDefault(c => c.Id == presupuesto.CategoriaId);
                Presupuestos.Add(new PresupuestoItem(presupuesto, categoria, avance));
            }
            HayPresupuestos = Presupuestos.Count > 0;
        }
        catch (Exception ex)
        {
            await _navegador.AlertaAsync("Error", $"No se pudieron cargar los presupuestos: {ex.Message}");
        }
    }

    [RelayCommand]
    private Task NuevoAsync() => _navegador.IrAAsync("edicionPresupuesto");

    [RelayCommand]
    private Task EditarAsync(PresupuestoItem item) =>
        _navegador.IrAAsync("edicionPresupuesto", new Dictionary<string, object> { ["id"] = item.Presupuesto.Id });
}
