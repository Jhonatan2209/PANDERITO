using Panderito.Core.ViewModels;

namespace Panderito.App.Views;

public partial class PresupuestosPage : ContentPage
{
    private readonly PresupuestosViewModel _vm;

    public PresupuestosPage(PresupuestosViewModel vm)
    {
        InitializeComponent();
        BindingContext = _vm = vm;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await _vm.CargarAsync();
    }
}
