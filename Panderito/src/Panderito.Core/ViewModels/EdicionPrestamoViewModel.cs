using System.Globalization;
using Panderito.Core.Data;
using Panderito.Core.Models;
using Panderito.Core.Services;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace Panderito.Core.ViewModels;

public partial class EdicionPrestamoViewModel : BaseViewModel
{
    private readonly PanderitoDatabase _db;
    private readonly INavegador _navegador;

    [ObservableProperty] private string _persona = string.Empty;
    [ObservableProperty] private string _montoTexto = string.Empty;
    [ObservableProperty] private int _indiceTipo; // 0 = Me deben, 1 = Debo
    [ObservableProperty] private DateTime _fecha = DateTime.Today;
    [ObservableProperty] private bool _tieneVencimiento;
    [ObservableProperty] private DateTime _fechaVencimiento = DateTime.Today.AddMonths(1);
    [ObservableProperty] private string _nota = string.Empty;

    public EdicionPrestamoViewModel(PanderitoDatabase db, INavegador navegador)
    {
        _db = db;
        _navegador = navegador;
        Titulo = "Nuevo préstamo";
    }

    public void Preparar(int indiceTipo)
    {
        IndiceTipo = indiceTipo;
        Persona = string.Empty;
        MontoTexto = string.Empty;
        Fecha = DateTime.Today;
        TieneVencimiento = false;
        FechaVencimiento = DateTime.Today.AddMonths(1);
        Nota = string.Empty;
    }

    [RelayCommand] private void MarcarMeDeben() => IndiceTipo = 0;
    [RelayCommand] private void MarcarDebo() => IndiceTipo = 1;

    [RelayCommand]
    private async Task GuardarAsync()
    {
        if (string.IsNullOrWhiteSpace(Persona))
        {
            await _navegador.AlertaAsync("Falta la persona", "Indica a quién corresponde el préstamo.");
            return;
        }
        if (!decimal.TryParse(MontoTexto, NumberStyles.Number, FormatoMoneda.CulturaPeru, out var monto) || monto <= 0)
        {
            await _navegador.AlertaAsync("Monto inválido", "Ingresa un monto mayor a cero.");
            return;
        }

        try
        {
            await _db.InicializarAsync();
            await _db.Connection.InsertAsync(new Prestamo
            {
                Persona = Persona.Trim(),
                Monto = monto,
                Tipo = IndiceTipo == 0 ? TipoPrestamo.PorCobrar : TipoPrestamo.PorPagar,
                Fecha = Fecha,
                FechaVencimiento = TieneVencimiento ? FechaVencimiento : null,
                Estado = EstadoPrestamo.Pendiente,
                Nota = Nota?.Trim() ?? string.Empty
            });
            await _navegador.VolverAsync();
        }
        catch (Exception ex)
        {
            await _navegador.AlertaAsync("Error", $"No se pudo guardar: {ex.Message}");
        }
    }
}
