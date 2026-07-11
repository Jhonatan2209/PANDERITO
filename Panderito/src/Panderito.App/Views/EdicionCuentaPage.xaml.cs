using Panderito.Core.ViewModels;

namespace Panderito.App.Views;

[QueryProperty(nameof(CuentaId), "id")]
public partial class EdicionCuentaPage : ContentPage
{
    private readonly EdicionCuentaViewModel _vm;

    public int CuentaId { get; set; }

    public EdicionCuentaPage(EdicionCuentaViewModel vm)
    {
        InitializeComponent();
        BindingContext = _vm = vm;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await _vm.CargarAsync(CuentaId);
    }
}
