using Chanchito.Core.ViewModels;

namespace Chanchito.App.Views;

public partial class MetasPage : ContentPage
{
    private readonly MetasViewModel _vm;

    public MetasPage(MetasViewModel vm)
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
