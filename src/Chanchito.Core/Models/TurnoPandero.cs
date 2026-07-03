using SQLite;

namespace Chanchito.Core.Models;

[Table("TurnoPandero")]
public class TurnoPandero
{
    [PrimaryKey, AutoIncrement]
    public int Id { get; set; }

    [Indexed]
    public int PanderoId { get; set; }

    public int NumeroTurno { get; set; }

    public string NombreParticipante { get; set; } = string.Empty;

    public DateTime FechaCobro { get; set; }

    public bool Cobrado { get; set; }
}
