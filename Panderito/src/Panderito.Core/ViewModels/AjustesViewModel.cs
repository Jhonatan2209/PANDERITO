using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;

namespace Panderito.Core.ViewModels;

public partial class AjustesViewModel : BaseViewModel
{
    private readonly IApariencia _apariencia;
    private readonly INavegador _navegador;
    private bool _cargando;

    public IReadOnlyList<string> Temas { get; } = new[] { "Según el sistema", "Claro", "Oscuro" };

    [ObservableProperty] private int _indiceTema;

    public string VersionTexto => "Panderito 1.0.0 · Hecho con 🐷 en Perú";

    public AjustesViewModel(IApariencia apariencia, INavegador navegador)
    {
        _apariencia = apariencia;
        _navegador = navegador;
        Titulo = "Ajustes";
    }

    public void Cargar()
    {
        _cargando = true;
        IndiceTema = _apariencia.ObtenerTema();
        _cargando = false;
    }

    partial void OnIndiceTemaChanged(int value)
    {
        if (!_cargando)
            _apariencia.AplicarTema(value);
    }

    [RelayCommand]
    private Task IrACategoriasAsync() => _navegador.IrAAsync("categorias");
}
