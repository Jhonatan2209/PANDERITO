using Panderito.Core.ViewModels;

namespace Panderito.App.Views;

public partial class MasPage : ContentPage
{
    public MasPage(MasViewModel vm)
    {
        InitializeComponent();
        BindingContext = vm;
    }
}
