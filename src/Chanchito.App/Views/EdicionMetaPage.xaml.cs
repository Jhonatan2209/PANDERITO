using Chanchito.Core.ViewModels;

namespace Chanchito.App.Views;

[QueryProperty(nameof(MetaId), "id")]
public partial class EdicionMetaPage : ContentPage
{
    private readonly EdicionMetaViewModel _vm;

    public int MetaId { get; set; }

    public EdicionMetaPage(EdicionMetaViewModel vm)
    {
        InitializeComponent();
        BindingContext = _vm = vm;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await _vm.CargarAsync(MetaId);
    }
}
