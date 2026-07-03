using System.Globalization;
using Chanchito.Core.Data;
using Chanchito.Core.Models;
using Chanchito.Core.Services;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace Chanchito.Core.ViewModels;

public partial class EdicionCuentaViewModel : BaseViewModel
{
    private readonly ChanchitoDatabase _db;
    private readonly INavegador _navegador;
    private Cuenta? _cuenta;

    public IReadOnlyList<string> Tipos { get; } =
        Enum.GetValues<TipoCuenta>().Select(EtiquetasDominio.DeTipoCuenta).ToList();

    [ObservableProperty] private string _nombre = string.Empty;
    [ObservableProperty] private int _indiceTipo;
    [ObservableProperty] private string _saldoInicialTexto = string.Empty;
    [ObservableProperty] private bool _esEdicion;

    public EdicionCuentaViewModel(ChanchitoDatabase db, INavegador navegador)
    {
        _db = db;
        _navegador = navegador;
        Titulo = "Cuenta";
    }

    public async Task CargarAsync(int id)
    {
        await _db.InicializarAsync();
        if (id == 0)
        {
            _cuenta = null;
            EsEdicion = false;
            Nombre = string.Empty;
            IndiceTipo = 0;
            SaldoInicialTexto = string.Empty;
            return;
        }

        _cuenta = await _db.Connection.FindAsync<Cuenta>(id);
        if (_cuenta is null) return;
        EsEdicion = true;
        Nombre = _cuenta.Nombre;
        IndiceTipo = (int)_cuenta.Tipo;
        SaldoInicialTexto = _cuenta.SaldoInicial.ToString(FormatoMoneda.CulturaPeru);
    }

    [RelayCommand]
    private async Task GuardarAsync()
    {
        if (string.IsNullOrWhiteSpace(Nombre))
        {
            await _navegador.AlertaAsync("Falta el nombre", "Ponle un nombre a la cuenta.");
            return;
        }
        decimal saldoInicial = 0m;
        if (!string.IsNullOrWhiteSpace(SaldoInicialTexto) &&
            !decimal.TryParse(SaldoInicialTexto, NumberStyles.Number, FormatoMoneda.CulturaPeru, out saldoInicial))
        {
            await _navegador.AlertaAsync("Saldo inválido", "Revisa el saldo inicial.");
            return;
        }

        try
        {
            var tipo = (TipoCuenta)IndiceTipo;
            var cuenta = _cuenta ?? new Cuenta();
            cuenta.Nombre = Nombre.Trim();
            cuenta.Tipo = tipo;
            cuenta.SaldoInicial = saldoInicial;
            cuenta.Icono = tipo switch
            {
                TipoCuenta.Yape => "📱",
                TipoCuenta.Plin => "📲",
                TipoCuenta.Banco => "🏦",
                TipoCuenta.Tarjeta => "💳",
                _ => "💵"
            };

            if (cuenta.Id == 0) await _db.Connection.InsertAsync(cuenta);
            else await _db.Connection.UpdateAsync(cuenta);

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
        if (_cuenta is null) return;
        var movimientos = await _db.Connection.Table<Movimiento>()
            .Where(m => m.CuentaId == _cuenta.Id).CountAsync();
        var mensaje = movimientos > 0
            ? $"La cuenta tiene {movimientos} movimientos. Se ocultará (no se borran los movimientos). ¿Continuar?"
            : "¿Eliminar esta cuenta?";
        if (!await _navegador.ConfirmarAsync("Eliminar cuenta", mensaje, "Eliminar")) return;

        try
        {
            if (movimientos > 0)
            {
                _cuenta.Activa = false;
                await _db.Connection.UpdateAsync(_cuenta);
            }
            else
            {
                await _db.Connection.DeleteAsync(_cuenta);
            }
            await _navegador.VolverAsync();
        }
        catch (Exception ex)
        {
            await _navegador.AlertaAsync("Error", $"No se pudo eliminar: {ex.Message}");
        }
    }
}
