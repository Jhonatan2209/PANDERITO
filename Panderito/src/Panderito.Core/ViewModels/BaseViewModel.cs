using CommunityToolkit.Mvvm.ComponentModel;

namespace Panderito.Core.ViewModels;

/// <summary>Base de todos los ViewModels: estado de carga y título.</summary>
public abstract partial class BaseViewModel : ObservableObject
{
    [ObservableProperty]
    [NotifyPropertyChangedFor(nameof(NoEstaOcupado))]
    private bool _estaOcupado;

    [ObservableProperty]
    private string _titulo = string.Empty;

    public bool NoEstaOcupado => !EstaOcupado;
}
