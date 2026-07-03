using Chanchito.Core.ViewModels;

namespace Chanchito.App.Views;

public partial class RegistroPage : ContentPage
{
    private readonly RegistroMovimientoViewModel _vm;

    public RegistroPage(RegistroMovimientoViewModel vm)
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
