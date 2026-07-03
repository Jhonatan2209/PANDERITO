using Chanchito.Core.ViewModels;

namespace Chanchito.App.Views;

[QueryProperty(nameof(PanderoId), "id")]
public partial class DetallePanderoPage : ContentPage
{
    private readonly DetallePanderoViewModel _vm;

    public int PanderoId { get; set; }

    public DetallePanderoPage(DetallePanderoViewModel vm)
    {
        InitializeComponent();
        BindingContext = _vm = vm;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await _vm.CargarAsync(PanderoId);
    }
}
