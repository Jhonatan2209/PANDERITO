using Panderito.Core.ViewModels;

namespace Panderito.App.Views;

[QueryProperty(nameof(IndiceTipo), "tipo")]
public partial class EdicionPrestamoPage : ContentPage
{
    private readonly EdicionPrestamoViewModel _vm;

    public int IndiceTipo { get; set; }

    public EdicionPrestamoPage(EdicionPrestamoViewModel vm)
    {
        InitializeComponent();
        BindingContext = _vm = vm;
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();
        _vm.Preparar(IndiceTipo);
    }
}
