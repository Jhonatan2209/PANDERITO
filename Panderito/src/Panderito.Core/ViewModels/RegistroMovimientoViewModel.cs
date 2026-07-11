using System.Collections.ObjectModel;
using System.Globalization;
using Panderito.Core.Data;
using Panderito.Core.Models;
using Panderito.Core.Services;
using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace Panderito.Core.ViewModels;

public partial class RegistroMovimientoViewModel : BaseViewModel
{
    private readonly PanderitoDatabase _db;
    private readonly ServicioMovimientos _movimientos;
    private readonly INavegador _navegador;

    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(EsIngreso))]
    private bool _esGasto = true;

    [ObservableProperty] private string _montoTexto = string.Empty;
    [ObservableProperty] private Categoria? _categoriaSeleccionada;
    [ObservableProperty] private Cuenta? _cuentaSeleccionada;
    [ObservableProperty] private DateTime _fecha = DateTime.Today;
    [ObservableProperty] private string _nota = string.Empty;

    public bool EsIngreso => !EsGasto;

    public ObservableCollection<Categoria> Categorias { get; } = new();
    public ObservableCollection<Cuenta> Cuentas { get; } = new();

    public RegistroMovimientoViewModel(PanderitoDatabase db, ServicioMovimientos movimientos, INavegador navegador)
    {
        _db = db;
        _movimientos = movimientos;
        _navegador = navegador;
        Titulo = "Registrar";
    }

    partial void OnEsGastoChanged(bool value) => _ = CargarCategoriasAsync();

    [RelayCommand]
    public async Task CargarAsync()
    {
        try
        {
            await _db.InicializarAsync();
            await CargarCategoriasAsync();

            Cuentas.Clear();
            var cuentas = await _db.Connection.Table<Cuenta>().Where(c => c.Activa).ToListAsync();
            foreach (var c in cuentas) Cuentas.Add(c);
            CuentaSeleccionada ??= Cuentas.FirstOrDefault();
            if (Fecha == default) Fecha = DateTime.Today;
        }
        catch (Exception ex)
        {
            await _navegador.AlertaAsync("Error", $"No se pudieron cargar los datos: {ex.Message}");
        }
    }

    private async Task CargarCategoriasAsync()
    {
        try
        {
            await _db.InicializarAsync();
            var tipo = EsGasto ? TipoMovimiento.Gasto : TipoMovimiento.Ingreso;
            var categorias = await _db.Connection.Table<Categoria>()
                .Where(c => c.TipoMovimiento == tipo)
                .ToListAsync();
            Categorias.Clear();
            foreach (var c in categorias) Categorias.Add(c);
            CategoriaSeleccionada = Categorias.FirstOrDefault();
        }
        catch
        {
            // sin datos no se puede registrar; la validación de Guardar lo detecta
        }
    }

    [RelayCommand]
    private void MarcarGasto() => EsGasto = true;

    [RelayCommand]
    private void MarcarIngreso() => EsGasto = false;

    [RelayCommand]
    private async Task GuardarAsync()
    {
        if (EstaOcupado) return;

        if (!decimal.TryParse(MontoTexto, NumberStyles.Number, FormatoMoneda.CulturaPeru, out var monto) || monto <= 0)
        {
            await _navegador.AlertaAsync("Monto inválido", "Ingresa un monto mayor a cero.");
            return;
        }
        if (CategoriaSeleccionada is null)
        {
            await _navegador.AlertaAsync("Falta la categoría", "Elige una categoría.");
            return;
        }
        if (CuentaSeleccionada is null)
        {
            await _navegador.AlertaAsync("Falta la cuenta", "Elige una cuenta.");
            return;
        }

        try
        {
            EstaOcupado = true;
            var ahora = DateTime.Now;
            var fechaConHora = Fecha.Date == ahora.Date
                ? ahora
                : Fecha.Date.AddHours(12);

            await _movimientos.GuardarAsync(new Movimiento
            {
                Monto = monto,
                Tipo = EsGasto ? TipoMovimiento.Gasto : TipoMovimiento.Ingreso,
                CategoriaId = CategoriaSeleccionada.Id,
                CuentaId = CuentaSeleccionada.Id,
                Fecha = fechaConHora,
                Nota = Nota?.Trim() ?? string.Empty
            });

            Limpiar();
            await _navegador.AlertaAsync("¡Guardado! 🐷", "Tu movimiento quedó registrado.");
            await _navegador.IrAAsync("//inicio");
        }
        catch (Exception ex)
        {
            await _navegador.AlertaAsync("Error", $"No se pudo guardar: {ex.Message}");
        }
        finally
        {
            EstaOcupado = false;
        }
    }

    private void Limpiar()
    {
        MontoTexto = string.Empty;
        Nota = string.Empty;
        Fecha = DateTime.Today;
        EsGasto = true;
    }
}
