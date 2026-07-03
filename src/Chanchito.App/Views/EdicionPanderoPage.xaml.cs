using Chanchito.Core.ViewModels;

namespace Chanchito.App.Views;

public partial class EdicionPanderoPage : ContentPage
{
    private readonly EdicionPanderoViewModel _vm;

    public EdicionPanderoPage(EdicionPanderoViewModel vm)
    {
        InitializeComponent();
        BindingContext = _vm = vm;
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();
        _vm.Preparar();
    }
}
