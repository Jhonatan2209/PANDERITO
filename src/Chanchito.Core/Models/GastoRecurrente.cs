using SQLite;

namespace Chanchito.Core.Models;

[Table("GastoRecurrente")]
public class GastoRecurrente
{
    [PrimaryKey, AutoIncrement]
    public int Id { get; set; }

    [NotNull]
    public string Nombre { get; set; } = string.Empty;

    public decimal Monto { get; set; }

    [Indexed]
    public int CategoriaId { get; set; }

    [Indexed]
    public int CuentaId { get; set; }

    public Frecuencia Frecuencia { get; set; } = Frecuencia.Mensual;

    public DateTime ProximaFecha { get; set; }

    public bool Activo { get; set; } = true;
}
