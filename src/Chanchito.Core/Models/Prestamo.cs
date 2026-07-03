using SQLite;

namespace Chanchito.Core.Models;

[Table("Prestamo")]
public class Prestamo
{
    [PrimaryKey, AutoIncrement]
    public int Id { get; set; }

    [NotNull]
    public string Persona { get; set; } = string.Empty;

    public decimal Monto { get; set; }

    public TipoPrestamo Tipo { get; set; }

    public DateTime Fecha { get; set; } = DateTime.Now;

    public DateTime? FechaVencimiento { get; set; }

    public EstadoPrestamo Estado { get; set; } = EstadoPrestamo.Pendiente;

    public string Nota { get; set; } = string.Empty;
}
