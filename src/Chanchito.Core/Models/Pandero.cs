using SQLite;

namespace Chanchito.Core.Models;

[Table("Pandero")]
public class Pandero
{
    [PrimaryKey, AutoIncrement]
    public int Id { get; set; }

    [NotNull]
    public string Nombre { get; set; } = string.Empty;

    public int NumParticipantes { get; set; }

    public decimal CuotaMonto { get; set; }

    public Frecuencia Frecuencia { get; set; } = Frecuencia.Mensual;

    public DateTime FechaInicio { get; set; } = DateTime.Now;

    public int MiTurno { get; set; } = 1;

    public bool Activo { get; set; } = true;
}
