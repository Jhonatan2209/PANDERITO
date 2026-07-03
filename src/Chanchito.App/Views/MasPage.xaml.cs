using Chanchito.Core.ViewModels;

namespace Chanchito.App.Views;

public partial class MasPage : ContentPage
{
    public MasPage(MasViewModel vm)
    {
        InitializeComponent();
        BindingContext = vm;
    }
}
