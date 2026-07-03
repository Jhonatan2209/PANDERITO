using System.Collections.ObjectModel;
using Chanchito.Core.Data;
using Chanchito.Core.Models;
using Chanchito.Core.Services;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace Chanchito.Core.ViewModels;

public record CuentaConSaldo(Cuenta Cuenta, decimal Saldo)
{
    public string SaldoTexto => FormatoMoneda.EnSoles(Saldo);
    public string NombreTipo => EtiquetasDominio.DeTipoCuenta(Cuenta.Tipo);
}

/// <summary>Nombres en español de los enums del dominio, para la UI.</summary>
public static class EtiquetasDominio
{
    public static string DeTipoCuenta(TipoCuenta tipo) => tipo switch
    {
        TipoCuenta.Efectivo => "Efectivo",
        TipoCuenta.Yape => "Yape",
        TipoCuenta.Plin => "Plin",
        TipoCuenta.Banco => "Banco",
        TipoCuenta.Tarjeta => "Tarjeta",
        _ => tipo.ToString()
    };

    public static string DeFrecuencia(Frecuencia f) => f switch
    {
        Frecuencia.Semanal => "Semanal",
        Frecuencia.Quincenal => "Quincenal",
        _ => "Mensual"
    };
}

public partial class CuentasViewModel : BaseViewModel
{
    private readonly ChanchitoDatabase _db;
    private readonly ServicioSaldos _saldos;
    private readonly INavegador _navegador;

    [ObservableProperty] private bool _hayCuentas = true;

    public ObservableCollection<CuentaConSaldo> Cuentas { get; } = new();

    public CuentasViewModel(ChanchitoDatabase db, ServicioSaldos saldos, INavegador navegador)
    {
        _db = db;
        _saldos = saldos;
        _navegador = navegador;
        Titulo = "Cuentas";
    }

    [RelayCommand]
    public async Task CargarAsync()
    {
        try
        {
            await _db.InicializarAsync();
            var cuentas = await _db.Connection.Table<Cuenta>().Where(c => c.Activa).ToListAsync();
            Cuentas.Clear();
            foreach (var cuenta in cuentas)
                Cuentas.Add(new CuentaConSaldo(cuenta, await _saldos.CalcularSaldoCuentaAsync(cuenta)));
            HayCuentas = Cuentas.Count > 0;
        }
        catch (Exception ex)
        {
            await _navegador.AlertaAsync("Error", $"No se pudieron cargar las cuentas: {ex.Message}");
        }
    }

    [RelayCommand]
    private Task NuevaAsync() => _navegador.IrAAsync("edicionCuenta");

    [RelayCommand]
    private Task EditarAsync(CuentaConSaldo item) =>
        _navegador.IrAAsync("edicionCuenta", new Dictionary<string, object> { ["id"] = item.Cuenta.Id });
}
