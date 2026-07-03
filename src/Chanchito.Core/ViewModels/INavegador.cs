namespace Chanchito.Core.ViewModels;

/// <summary>Abstracción de navegación y diálogos para que los ViewModels no dependan de MAUI.</summary>
public interface INavegador
{
    Task IrAAsync(string ruta, IDictionary<string, object>? parametros = null);
    Task VolverAsync();
    Task AlertaAsync(string titulo, string mensaje);
    Task<bool> ConfirmarAsync(string titulo, string mensaje, string aceptar = "Sí", string cancelar = "Cancelar");
}
