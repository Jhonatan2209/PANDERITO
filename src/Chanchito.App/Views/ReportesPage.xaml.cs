using Chanchito.Core.ViewModels;

namespace Chanchito.App.Views;

public partial class ReportesPage : ContentPage
{
    private readonly ReportesViewModel _vm;

    public ReportesPage(ReportesViewModel vm)
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
