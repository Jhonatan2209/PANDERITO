using Panderito.Core.ViewModels;

namespace Panderito.App.Views;

public partial class PrestamosPage : ContentPage
{
    private readonly PrestamosViewModel _vm;

    public PrestamosPage(PrestamosViewModel vm)
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
