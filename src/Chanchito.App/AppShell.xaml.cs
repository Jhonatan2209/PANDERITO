using Chanchito.App.Views;

namespace Chanchito.App;

public partial class AppShell : Shell
{
	public AppShell()
	{
		InitializeComponent();

		// Rutas de detalle (fuera de los tabs)
		Routing.RegisterRoute("detalleMovimiento", typeof(DetalleMovimientoPage));
	}
}
