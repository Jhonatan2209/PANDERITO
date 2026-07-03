using SQLite;

namespace Chanchito.Core.Models;

[Table("Cuenta")]
public class Cuenta
{
    [PrimaryKey, AutoIncrement]
    public int Id { get; set; }

    [NotNull]
    public string Nombre { get; set; } = string.Empty;

    public TipoCuenta Tipo { get; set; }

    public decimal SaldoInicial { get; set; }

    public string Icono { get; set; } = "💵";

    public string ColorHex { get; set; } = "#22C55E";

    public bool Activa { get; set; } = true;
}
