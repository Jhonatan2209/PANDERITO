using Chanchito.Core.ViewModels;

namespace Chanchito.App.Views;

public partial class AjustesPage : ContentPage
{
    private readonly AjustesViewModel _vm;

    public AjustesPage(AjustesViewModel vm)
    {
        InitializeComponent();
        BindingContext = _vm = vm;
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();
        _vm.Cargar();
    }
}
