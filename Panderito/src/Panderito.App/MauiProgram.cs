using Panderito.App.Servicios;
using Panderito.App.Views;
using Panderito.Core.Data;
using Panderito.Core.Services;
using Panderito.Core.ViewModels;
using CommunityToolkit.Maui;
using Microsoft.Extensions.Logging;

namespace Panderito.App;

public static class MauiProgram
{
	public static MauiApp CreateMauiApp()
	{
		var builder = MauiApp.CreateBuilder();
		builder
			.UseMauiApp<App>()
			.UseMauiCommunityToolkit()
			.ConfigureFonts(fonts =>
			{
				fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
				fonts.AddFont("OpenSans-Semibold.ttf", "OpenSansSemibold");
			});

		RegistrarServicios(builder.Services);

#if DEBUG
		builder.Logging.AddDebug();
#endif

		return builder.Build();
	}

	private static void RegistrarServicios(IServiceCollection servicios)
	{
		// Base de datos (archivo local de la app, offline)
		servicios.AddSingleton(_ => new PanderitoDatabase(
			Path.Combine(FileSystem.AppDataDirectory, PanderitoDatabase.NombreArchivo)));
		servicios.AddSingleton(typeof(Repository<>));

		// Servicios de negocio
		servicios.AddSingleton<ServicioSaldos>();
		servicios.AddSingleton<ServicioMovimientos>();
		servicios.AddSingleton<ServicioPresupuestos>();
		servicios.AddSingleton<ServicioPanderos>();
		servicios.AddSingleton<ServicioPrestamos>();
		servicios.AddSingleton<ServicioRecurrentes>();

		// Navegación y apariencia
		servicios.AddSingleton<INavegador, NavegadorShell>();
		servicios.AddSingleton<IApariencia, AparienciaApp>();

		// ViewModels
		servicios.AddTransient<DashboardViewModel>();
		servicios.AddTransient<RegistroMovimientoViewModel>();
		servicios.AddTransient<HistorialViewModel>();
		servicios.AddTransient<DetalleMovimientoViewModel>();
		servicios.AddTransient<CuentasViewModel>();
		servicios.AddTransient<EdicionCuentaViewModel>();
		servicios.AddTransient<PrestamosViewModel>();
		servicios.AddTransient<EdicionPrestamoViewModel>();
		servicios.AddTransient<DetallePrestamoViewModel>();
		servicios.AddTransient<PanderosViewModel>();
		servicios.AddTransient<EdicionPanderoViewModel>();
		servicios.AddTransient<DetallePanderoViewModel>();
		servicios.AddTransient<MetasViewModel>();
		servicios.AddTransient<EdicionMetaViewModel>();
		servicios.AddTransient<RecurrentesViewModel>();
		servicios.AddTransient<EdicionRecurrenteViewModel>();
		servicios.AddTransient<PresupuestosViewModel>();
		servicios.AddTransient<EdicionPresupuestoViewModel>();
		servicios.AddTransient<CategoriasViewModel>();
		servicios.AddTransient<EdicionCategoriaViewModel>();
		servicios.AddTransient<ReportesViewModel>();
		servicios.AddTransient<AjustesViewModel>();
		servicios.AddTransient<MasViewModel>();

		// Páginas
		servicios.AddTransient<DashboardPage>();
		servicios.AddTransient<HistorialPage>();
		servicios.AddTransient<RegistroPage>();
		servicios.AddTransient<ReportesPage>();
		servicios.AddTransient<MasPage>();
		servicios.AddTransient<DetalleMovimientoPage>();
		servicios.AddTransient<CuentasPage>();
		servicios.AddTransient<EdicionCuentaPage>();
		servicios.AddTransient<PrestamosPage>();
		servicios.AddTransient<EdicionPrestamoPage>();
		servicios.AddTransient<DetallePrestamoPage>();
		servicios.AddTransient<PanderosPage>();
		servicios.AddTransient<EdicionPanderoPage>();
		servicios.AddTransient<DetallePanderoPage>();
		servicios.AddTransient<MetasPage>();
		servicios.AddTransient<EdicionMetaPage>();
		servicios.AddTransient<RecurrentesPage>();
		servicios.AddTransient<EdicionRecurrentePage>();
		servicios.AddTransient<PresupuestosPage>();
		servicios.AddTransient<EdicionPresupuestoPage>();
		servicios.AddTransient<CategoriasPage>();
		servicios.AddTransient<EdicionCategoriaPage>();
		servicios.AddTransient<AjustesPage>();
	}
}
