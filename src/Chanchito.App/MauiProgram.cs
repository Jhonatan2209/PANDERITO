using Chanchito.App.Views;
using Chanchito.Core.Data;
using Chanchito.Core.Services;
using CommunityToolkit.Maui;
using Microsoft.Extensions.Logging;

namespace Chanchito.App;

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
		servicios.AddSingleton(_ => new ChanchitoDatabase(
			Path.Combine(FileSystem.AppDataDirectory, ChanchitoDatabase.NombreArchivo)));
		servicios.AddSingleton(typeof(Repository<>));

		// Servicios de negocio
		servicios.AddSingleton<ServicioSaldos>();
		servicios.AddSingleton<ServicioMovimientos>();
		servicios.AddSingleton<ServicioPresupuestos>();
		servicios.AddSingleton<ServicioPanderos>();
		servicios.AddSingleton<ServicioPrestamos>();
		servicios.AddSingleton<ServicioRecurrentes>();

		// Páginas (los ViewModels se registran junto a cada pantalla en fases 4-5)
		servicios.AddTransient<DashboardPage>();
		servicios.AddTransient<HistorialPage>();
		servicios.AddTransient<RegistroPage>();
		servicios.AddTransient<ReportesPage>();
		servicios.AddTransient<MasPage>();
	}
}
