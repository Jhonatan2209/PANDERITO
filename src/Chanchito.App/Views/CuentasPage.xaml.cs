using Chanchito.Core.ViewModels;

namespace Chanchito.App.Views;

public partial class CuentasPage : ContentPage
{
    private readonly CuentasViewModel _vm;

    public CuentasPage(CuentasViewModel vm)
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
