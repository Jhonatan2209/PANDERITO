using Chanchito.Core.ViewModels;

namespace Chanchito.App.Servicios;

/// <summary>INavegador sobre Shell y diálogos de la página actual.</summary>
public class NavegadorShell : INavegador
{
    public Task IrAAsync(string ruta, IDictionary<string, object>? parametros = null) =>
        parametros is null
            ? Shell.Current.GoToAsync(ruta)
            : Shell.Current.GoToAsync(ruta, parametros);

    public Task VolverAsync() => Shell.Current.GoToAsync("..");

    public Task AlertaAsync(string titulo, string mensaje) =>
        Shell.Current.CurrentPage?.DisplayAlert(titulo, mensaje, "OK") ?? Task.CompletedTask;

    public async Task<bool> ConfirmarAsync(string titulo, string mensaje, string aceptar = "Sí", string cancelar = "Cancelar")
    {
        var pagina = Shell.Current.CurrentPage;
        if (pagina is null) return false;
        return await pagina.DisplayAlert(titulo, mensaje, aceptar, cancelar);
    }
}
