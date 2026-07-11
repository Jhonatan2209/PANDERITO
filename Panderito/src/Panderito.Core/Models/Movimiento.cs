using SQLite;

namespace Panderito.Core.Models;

[Table("Movimiento")]
public class Movimiento
{
    [PrimaryKey, AutoIncrement]
    public int Id { get; set; }

    public decimal Monto { get; set; }

    public TipoMovimiento Tipo { get; set; }

    [Indexed]
    public int CategoriaId { get; set; }

    [Indexed]
    public int CuentaId { get; set; }

    [Indexed]
    public DateTime Fecha { get; set; } = DateTime.Now;

    public string Nota { get; set; } = string.Empty;

    public string? RutaFoto { get; set; }
}
