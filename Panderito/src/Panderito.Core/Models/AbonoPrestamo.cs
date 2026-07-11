using SQLite;

namespace Panderito.Core.Models;

[Table("AbonoPrestamo")]
public class AbonoPrestamo
{
    [PrimaryKey, AutoIncrement]
    public int Id { get; set; }

    [Indexed]
    public int PrestamoId { get; set; }

    public decimal Monto { get; set; }

    public DateTime Fecha { get; set; } = DateTime.Now;
}
