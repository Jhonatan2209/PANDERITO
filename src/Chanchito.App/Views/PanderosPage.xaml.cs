using Chanchito.Core.ViewModels;

namespace Chanchito.App.Views;

public partial class PanderosPage : ContentPage
{
    private readonly PanderosViewModel _vm;

    public PanderosPage(PanderosViewModel vm)
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
