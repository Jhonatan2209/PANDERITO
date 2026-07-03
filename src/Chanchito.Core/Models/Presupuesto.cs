using SQLite;

namespace Chanchito.Core.Models;

[Table("Presupuesto")]
public class Presupuesto
{
    [PrimaryKey, AutoIncrement]
    public int Id { get; set; }

    [Indexed]
    public int CategoriaId { get; set; }

    public decimal MontoLimite { get; set; }

    public Frecuencia Periodo { get; set; } = Frecuencia.Mensual;
}
