using Chanchito.Core.ViewModels;

namespace Chanchito.App.Views;

public partial class RecurrentesPage : ContentPage
{
    private readonly RecurrentesViewModel _vm;

    public RecurrentesPage(RecurrentesViewModel vm)
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
