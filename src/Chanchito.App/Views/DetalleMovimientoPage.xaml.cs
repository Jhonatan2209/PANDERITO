using Chanchito.Core.ViewModels;

namespace Chanchito.App.Views;

[QueryProperty(nameof(MovimientoId), "id")]
public partial class DetalleMovimientoPage : ContentPage
{
    private readonly DetalleMovimientoViewModel _vm;

    public int MovimientoId { get; set; }

    public DetalleMovimientoPage(DetalleMovimientoViewModel vm)
    {
        InitializeComponent();
        BindingContext = _vm = vm;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await _vm.CargarAsync(MovimientoId);
    }
}
