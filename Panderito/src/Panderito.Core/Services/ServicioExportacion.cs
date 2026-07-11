using System.Text;
using Panderito.Core.Data;
using Panderito.Core.Models;

namespace Panderito.Core.Services;

/// <summary>Exportación de movimientos a CSV (UTF-8 con BOM para Excel).</summary>
public class ServicioExportacion
{
    private readonly PanderitoDatabase _db;

    public ServicioExportacion(PanderitoDatabase db)
    {
        _db = db;
    }

    public async Task<string> GenerarCsvMovimientosAsync()
    {
        await _db.InicializarAsync();
        var movimientos = await _db.Connection.Table<Movimiento>().OrderBy(m => m.Fecha).ToListAsync();
        var categorias = await _db.Connection.Table<Categoria>().ToListAsync();
        var cuentas = await _db.Connection.Table<Cuenta>().ToListAsync();
        return GenerarCsv(movimientos, categorias, cuentas);
    }

    public static string GenerarCsv(
        IEnumerable<Movimiento> movimientos,
        IEnumerable<Categoria> categorias,
        IEnumerable<Cuenta> cuentas)
    {
        var mapaCategorias = categorias.ToDictionary(c => c.Id, c => c.Nombre);
        var mapaCuentas = cuentas.ToDictionary(c => c.Id, c => c.Nombre);

        var sb = new StringBuilder();
        sb.AppendLine("Fecha,Tipo,Monto,Categoria,Cuenta,Nota");
        foreach (var m in movimientos)
        {
            var tipo = m.Tipo switch
            {
                TipoMovimiento.Ingreso => "Ingreso",
                TipoMovimiento.Gasto => "Gasto",
                _ => "Transferencia"
            };
            sb.Append(m.Fecha.ToString("yyyy-MM-dd HH:mm")).Append(',')
              .Append(tipo).Append(',')
              .Append(m.Monto.ToString("0.00", System.Globalization.CultureInfo.InvariantCulture)).Append(',')
              .Append(Escapar(mapaCategorias.GetValueOrDefault(m.CategoriaId, "Sin categoría"))).Append(',')
              .Append(Escapar(mapaCuentas.GetValueOrDefault(m.CuentaId, "—"))).Append(',')
              .Append(Escapar(m.Nota))
              .AppendLine();
        }
        return sb.ToString();
    }

    /// <summary>Encierra en comillas si contiene coma, comillas o saltos de línea (RFC 4180).</summary>
    public static string Escapar(string campo)
    {
        if (string.IsNullOrEmpty(campo)) return string.Empty;
        if (campo.Contains(',') || campo.Contains('"') || campo.Contains('\n') || campo.Contains('\r'))
            return $"\"{campo.Replace("\"", "\"\"")}\"";
        return campo;
    }
}
