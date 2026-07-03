using Chanchito.Core.ViewModels;

namespace Chanchito.App.Views;

public partial class CategoriasPage : ContentPage
{
    private readonly CategoriasViewModel _vm;

    public CategoriasPage(CategoriasViewModel vm)
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
