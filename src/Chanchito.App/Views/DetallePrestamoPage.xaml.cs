using Chanchito.Core.ViewModels;

namespace Chanchito.App.Views;

[QueryProperty(nameof(PrestamoId), "id")]
public partial class DetallePrestamoPage : ContentPage
{
    private readonly DetallePrestamoViewModel _vm;

    public int PrestamoId { get; set; }

    public DetallePrestamoPage(DetallePrestamoViewModel vm)
    {
        InitializeComponent();
        BindingContext = _vm = vm;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await _vm.CargarAsync(PrestamoId);
    }
}
