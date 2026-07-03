using Chanchito.App.Views;

namespace Chanchito.App;

public partial class AppShell : Shell
{
	public AppShell()
	{
		InitializeComponent();

		// Rutas de detalle (fuera de los tabs)
		Routing.RegisterRoute("detalleMovimiento", typeof(DetalleMovimientoPage));
		Routing.RegisterRoute("cuentas", typeof(CuentasPage));
		Routing.RegisterRoute("edicionCuenta", typeof(EdicionCuentaPage));
		Routing.RegisterRoute("prestamos", typeof(PrestamosPage));
		Routing.RegisterRoute("edicionPrestamo", typeof(EdicionPrestamoPage));
		Routing.RegisterRoute("detallePrestamo", typeof(DetallePrestamoPage));
		Routing.RegisterRoute("panderos", typeof(PanderosPage));
		Routing.RegisterRoute("edicionPandero", typeof(EdicionPanderoPage));
		Routing.RegisterRoute("detallePandero", typeof(DetallePanderoPage));
		Routing.RegisterRoute("metas", typeof(MetasPage));
		Routing.RegisterRoute("edicionMeta", typeof(EdicionMetaPage));
		Routing.RegisterRoute("recurrentes", typeof(RecurrentesPage));
		Routing.RegisterRoute("edicionRecurrente", typeof(EdicionRecurrentePage));
		Routing.RegisterRoute("presupuestos", typeof(PresupuestosPage));
		Routing.RegisterRoute("edicionPresupuesto", typeof(EdicionPresupuestoPage));
		Routing.RegisterRoute("categorias", typeof(CategoriasPage));
		Routing.RegisterRoute("edicionCategoria", typeof(EdicionCategoriaPage));
		Routing.RegisterRoute("ajustes", typeof(AjustesPage));
	}
}
