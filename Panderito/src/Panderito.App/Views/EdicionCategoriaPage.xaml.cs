using Panderito.Core.ViewModels;

namespace Panderito.App.Views;

[QueryProperty(nameof(CategoriaId), "id")]
[QueryProperty(nameof(IndiceTipo), "tipo")]
public partial class EdicionCategoriaPage : ContentPage
{
    private readonly EdicionCategoriaViewModel _vm;

    public int CategoriaId { get; set; }
    public int IndiceTipo { get; set; }

    public EdicionCategoriaPage(EdicionCategoriaViewModel vm)
    {
        InitializeComponent();
        BindingContext = _vm = vm;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await _vm.CargarAsync(CategoriaId, IndiceTipo);
    }
}
