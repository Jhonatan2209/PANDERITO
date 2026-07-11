namespace Panderito.Core.ViewModels;

/// <summary>Abstracción de tema y preferencias simples (implementada en el head MAUI).</summary>
public interface IApariencia
{
    /// <summary>0 = Sistema, 1 = Claro, 2 = Oscuro.</summary>
    int ObtenerTema();
    void AplicarTema(int indice);
}
