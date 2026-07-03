using CommunityToolkit.Mvvm.Input;

namespace Chanchito.Core.ViewModels;

public record OpcionMenu(string Icono, string Nombre, string Descripcion, string Ruta);

public partial class MasViewModel : BaseViewModel
{
    private readonly INavegador _navegador;

    public IReadOnlyList<OpcionMenu> Opciones { get; } = new List<OpcionMenu>
    {
        new("👛", "Cuentas", "Efectivo, Yape, Plin, banco…", "cuentas"),
        new("🤝", "Préstamos", "Me deben / Debo, con abonos", "prestamos"),
        new("🎡", "Panderos", "Juntas: turnos y aportes", "panderos"),
        new("🎯", "Metas de ahorro", "Con barra de progreso", "metas"),
        new("🔁", "Gastos recurrentes", "Luz, agua, internet…", "recurrentes"),
        new("📊", "Presupuestos", "Límite por categoría", "presupuestos"),
        new("🏷️", "Categorías", "Personaliza íconos y colores", "categorias"),
        new("⚙️", "Ajustes", "Tema, respaldo y más", "ajustes")
    };

    public MasViewModel(INavegador navegador)
    {
        _navegador = navegador;
        Titulo = "Más";
    }

    [RelayCommand]
    private Task AbrirAsync(OpcionMenu opcion) => _navegador.IrAAsync(opcion.Ruta);
}
