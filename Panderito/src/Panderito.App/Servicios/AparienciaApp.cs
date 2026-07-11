using Panderito.Core.ViewModels;

namespace Panderito.App.Servicios;

/// <summary>Tema claro/oscuro persistido en Preferences.</summary>
public class AparienciaApp : IApariencia
{
    private const string ClaveTema = "tema_app";

    public int ObtenerTema() => Preferences.Get(ClaveTema, 0);

    public void AplicarTema(int indice)
    {
        Preferences.Set(ClaveTema, indice);
        AplicarTemaGuardado();
    }

    public static void AplicarTemaGuardado()
    {
        var indice = Preferences.Get(ClaveTema, 0);
        if (Application.Current is null) return;
        Application.Current.UserAppTheme = indice switch
        {
            1 => AppTheme.Light,
            2 => AppTheme.Dark,
            _ => AppTheme.Unspecified
        };
    }
}
