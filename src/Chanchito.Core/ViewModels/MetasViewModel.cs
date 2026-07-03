using System.Collections.ObjectModel;
using Chanchito.Core.Data;
using Chanchito.Core.Models;
using Chanchito.Core.Services;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace Chanchito.Core.ViewModels;

public record MetaItem(MetaAhorro Meta)
{
    public double Avance => Meta.MontoMeta <= 0 ? 0 : Math.Min(1, (double)(Meta.MontoActual / Meta.MontoMeta));
    public string PorcentajeTexto => $"{Avance * 100:0}%";
    public string ProgresoTexto => $"{FormatoMoneda.EnSoles(Meta.MontoActual)} de {FormatoMoneda.EnSoles(Meta.MontoMeta)}";
    public bool Lograda => Meta.MontoActual >= Meta.MontoMeta && Meta.MontoMeta > 0;
}

public partial class MetasViewModel : BaseViewModel
{
    private readonly ChanchitoDatabase _db;
    private readonly INavegador _navegador;

    [ObservableProperty] private bool _hayMetas = true;

    public ObservableCollection<MetaItem> Metas { get; } = new();

    public MetasViewModel(ChanchitoDatabase db, INavegador navegador)
    {
        _db = db;
        _navegador = navegador;
        Titulo = "Metas de ahorro";
    }

    [RelayCommand]
    public async Task CargarAsync()
    {
        try
        {
            await _db.InicializarAsync();
            var metas = await _db.Connection.Table<MetaAhorro>().ToListAsync();
            Metas.Clear();
            foreach (var meta in metas.OrderBy(m => m.MontoActual >= m.MontoMeta ? 1 : 0))
                Metas.Add(new MetaItem(meta));
            HayMetas = Metas.Count > 0;
        }
        catch (Exception ex)
        {
            await _navegador.AlertaAsync("Error", $"No se pudieron cargar las metas: {ex.Message}");
        }
    }

    [RelayCommand]
    private Task NuevaAsync() => _navegador.IrAAsync("edicionMeta");

    [RelayCommand]
    private Task EditarAsync(MetaItem item) =>
        _navegador.IrAAsync("edicionMeta", new Dictionary<string, object> { ["id"] = item.Meta.Id });
}
