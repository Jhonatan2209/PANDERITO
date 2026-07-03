using Chanchito.Core.ViewModels;

namespace Chanchito.App.Views;

[QueryProperty(nameof(RecurrenteId), "id")]
public partial class EdicionRecurrentePage : ContentPage
{
    private readonly EdicionRecurrenteViewModel _vm;

    public int RecurrenteId { get; set; }

    public EdicionRecurrentePage(EdicionRecurrenteViewModel vm)
    {
        InitializeComponent();
        BindingContext = _vm = vm;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await _vm.CargarAsync(RecurrenteId);
    }
}
