using SQLite;

namespace Panderito.Core.Models;

[Table("Categoria")]
public class Categoria
{
    [PrimaryKey, AutoIncrement]
    public int Id { get; set; }

    [NotNull]
    public string Nombre { get; set; } = string.Empty;

    public TipoMovimiento TipoMovimiento { get; set; }

    public string Icono { get; set; } = "🏷️";

    public string ColorHex { get; set; } = "#6C5CE7";
}
