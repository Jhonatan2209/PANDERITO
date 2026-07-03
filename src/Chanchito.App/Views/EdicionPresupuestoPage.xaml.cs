using Chanchito.Core.ViewModels;

namespace Chanchito.App.Views;

[QueryProperty(nameof(PresupuestoId), "id")]
public partial class EdicionPresupuestoPage : ContentPage
{
    private readonly EdicionPresupuestoViewModel _vm;

    public int PresupuestoId { get; set; }

    public EdicionPresupuestoPage(EdicionPresupuestoViewModel vm)
    {
        InitializeComponent();
        BindingContext = _vm = vm;
    }

    protected override async void OnAppearing()
    {
        base.OnAppearing();
        await _vm.CargarAsync(PresupuestoId);
    }
}
