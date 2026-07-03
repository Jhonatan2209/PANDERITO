using System.Globalization;
using Chanchito.Core.Data;
using Chanchito.Core.Models;
using Chanchito.Core.Services;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace Chanchito.Core.ViewModels;

public partial class EdicionMetaViewModel : BaseViewModel
{
    private readonly ChanchitoDatabase _db;
    private readonly INavegador _navegador;
    private MetaAhorro? _meta;

    [ObservableProperty] private string _nombre = string.Empty;
    [ObservableProperty] private string _montoMetaTexto = string.Empty;
    [ObservableProperty] private bool _tieneFechaMeta;
    [ObservableProperty] private DateTime _fechaMeta = DateTime.Today.AddMonths(6);
    [ObservableProperty] private bool _esEdicion;
    [ObservableProperty] private string _progresoTexto = string.Empty;
    [ObservableProperty] private string _abonoTexto = string.Empty;

    public EdicionMetaViewModel(ChanchitoDatabase db, INavegador navegador)
    {
        _db = db;
        _navegador = navegador;
        Titulo = "Meta de ahorro";
    }

    public async Task CargarAsync(int id)
    {
        await _db.InicializarAsync();
        AbonoTexto = string.Empty;
        if (id == 0)
        {
            _meta = null;
            EsEdicion = false;
            Nombre = string.Empty;
            MontoMetaTexto = string.Empty;
            TieneFechaMeta = false;
            FechaMeta = DateTime.Today.AddMonths(6);
            ProgresoTexto = string.Empty;
            return;
        }

        _meta = await _db.Connection.FindAsync<MetaAhorro>(id);
        if (_meta is null) return;
        EsEdicion = true;
        Nombre = _meta.Nombre;
        MontoMetaTexto = _meta.MontoMeta.ToString(FormatoMoneda.CulturaPeru);
        TieneFechaMeta = _meta.FechaMeta is not null;
        FechaMeta = _meta.FechaMeta ?? DateTime.Today.AddMonths(6);
        ProgresoTexto = $"Ahorrado: {FormatoMoneda.EnSoles(_meta.MontoActual)}";
    }

    [RelayCommand]
    private async Task GuardarAsync()
    {
        if (string.IsNullOrWhiteSpace(Nombre))
        {
            await _navegador.AlertaAsync("Falta el nombre", "Ponle un nombre a la meta.");
            return;
        }
        if (!decimal.TryParse(MontoMetaTexto, NumberStyles.Number, FormatoMoneda.CulturaPeru, out var montoMeta) || montoMeta <= 0)
        {
            await _navegador.AlertaAsync("Monto inválido", "Ingresa un monto objetivo mayor a cero.");
            return;
        }

        try
        {
            var meta = _meta ?? new MetaAhorro();
            meta.Nombre = Nombre.Trim();
            meta.MontoMeta = montoMeta;
            meta.FechaMeta = TieneFechaMeta ? FechaMeta : null;

            if (meta.Id == 0) await _db.Connection.InsertAsync(meta);
            else await _db.Connection.UpdateAsync(meta);

            await _navegador.VolverAsync();
        }
        catch (Exception ex)
        {
            await _navegador.AlertaAsync("Error", $"No se pudo guardar: {ex.Message}");
        }
    }

    [RelayCommand]
    private async Task AbonarAsync()
    {
        if (_meta is null) return;
        if (!decimal.TryParse(AbonoTexto, NumberStyles.Number, FormatoMoneda.CulturaPeru, out var abono) || abono <= 0)
        {
            await _navegador.AlertaAsync("Monto inválido", "Ingresa un abono mayor a cero.");
            return;
        }

        try
        {
            _meta.MontoActual += abono;
            await _db.Connection.UpdateAsync(_meta);
            AbonoTexto = string.Empty;
            ProgresoTexto = $"Ahorrado: {FormatoMoneda.EnSoles(_meta.MontoActual)}";
            if (_meta.MontoActual >= _meta.MontoMeta)
                await _navegador.AlertaAsync("¡Meta lograda! 🎉", $"Alcanzaste {FormatoMoneda.EnSoles(_meta.MontoMeta)}.");
        }
        catch (Exception ex)
        {
            await _navegador.AlertaAsync("Error", $"No se pudo abonar: {ex.Message}");
        }
    }

    [RelayCommand]
    private async Task EliminarAsync()
    {
        if (_meta is null) return;
        if (!await _navegador.ConfirmarAsync("Eliminar meta", "¿Eliminar esta meta de ahorro?", "Eliminar")) return;

        try
        {
            await _db.Connection.DeleteAsync(_meta);
            await _navegador.VolverAsync();
        }
        catch (Exception ex)
        {
            await _navegador.AlertaAsync("Error", $"No se pudo eliminar: {ex.Message}");
        }
    }
}
