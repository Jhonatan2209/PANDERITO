using Panderito.App.Servicios;
using Microsoft.Extensions.DependencyInjection;

namespace Panderito.App;

public partial class App : Application
{
	public App()
	{
		InitializeComponent();
		AparienciaApp.AplicarTemaGuardado();
	}

	protected override Window CreateWindow(IActivationState? activationState)
	{
		return new Window(new AppShell());
	}
}