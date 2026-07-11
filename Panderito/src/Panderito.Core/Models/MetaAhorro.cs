using SQLite;

namespace Panderito.Core.Models;

[Table("MetaAhorro")]
public class MetaAhorro
{
    [PrimaryKey, AutoIncrement]
    public int Id { get; set; }

    [NotNull]
    public string Nombre { get; set; } = string.Empty;

    public decimal MontoMeta { get; set; }

    public decimal MontoActual { get; set; }

    public DateTime? FechaMeta { get; set; }

    public int? CuentaId { get; set; }
}
