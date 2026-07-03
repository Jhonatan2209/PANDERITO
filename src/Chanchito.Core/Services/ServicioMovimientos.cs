using Chanchito.Core.Data;
using Chanchito.Core.Models;

namespace Chanchito.Core.Services;

public record GastoPorCategoria(int CategoriaId, string Nombre, string Icono, string ColorHex, decimal Total);

public record FiltroMovimientos(
    DateTime? Desde = null,
    DateTime? Hasta = null,
    int? CategoriaId = null,
    int? CuentaId = null,
    TipoMovimiento? Tipo = null,
    string? TextoBusqueda = null);

/// <summary>Consultas de movimientos para dashboard, historial y reportes.</summary>
public class ServicioMovimientos
{
    private readonly ChanchitoDatabase _db;

    public ServicioMovimientos(ChanchitoDatabase db)
    {
        _db = db;
    }

    public async Task<List<Movimiento>> ObtenerRecientesAsync(int cantidad = 10)
    {
        await _db.InicializarAsync();
        return await _db.Connection.Table<Movimiento>()
            .OrderByDescending(m => m.Fecha)
            .Take(cantidad)
            .ToListAsync();
    }

    public async Task<List<Movimiento>> BuscarAsync(FiltroMovimientos filtro)
    {
        await _db.InicializarAsync();
        var consulta = _db.Connection.Table<Movimiento>();

        if (filtro.Desde is not null)
            consulta = consulta.Where(m => m.Fecha >= filtro.Desde.Value);
        if (filtro.Hasta is not null)
        {
            var hastaExclusivo = filtro.Hasta.Value.Date.AddDays(1);
            consulta = consulta.Where(m => m.Fecha < hastaExclusivo);
        }
        if (filtro.CategoriaId is not null)
            consulta = consulta.Where(m => m.CategoriaId == filtro.CategoriaId.Value);
        if (filtro.CuentaId is not null)
            consulta = consulta.Where(m => m.CuentaId == filtro.CuentaId.Value);
        if (filtro.Tipo is not null)
            consulta = consulta.Where(m => m.Tipo == filtro.Tipo.Value);

        var resultado = await consulta.OrderByDescending(m => m.Fecha).ToListAsync();

        if (!string.IsNullOrWhiteSpace(filtro.TextoBusqueda))
        {
            var texto = filtro.TextoBusqueda.Trim();
            resultado = resultado
                .Where(m => m.Nota.Contains(texto, StringComparison.OrdinalIgnoreCase))
                .ToList();
        }
        return resultado;
    }

    /// <summary>Total gastado por categoría en un mes (para la dona de reportes).</summary>
    public async Task<List<GastoPorCategoria>> GastosPorCategoriaAsync(int anio, int mes)
    {
        await _db.InicializarAsync();
        var desde = new DateTime(anio, mes, 1);
        var hasta = desde.AddMonths(1);
        var movimientos = await _db.Connection.Table<Movimiento>()
            .Where(m => m.Fecha >= desde && m.Fecha < hasta)
            .ToListAsync();
        var categorias = await _db.Connection.Table<Categoria>().ToListAsync();

        return movimientos
            .Where(m => m.Tipo == TipoMovimiento.Gasto)
            .GroupBy(m => m.CategoriaId)
            .Select(g =>
            {
                var cat = categorias.FirstOrDefault(c => c.Id == g.Key);
                return new GastoPorCategoria(
                    g.Key,
                    cat?.Nombre ?? "Sin categoría",
                    cat?.Icono ?? "🏷️",
                    cat?.ColorHex ?? "#6B7280",
                    g.Sum(m => m.Monto));
            })
            .OrderByDescending(x => x.Total)
            .ToList();
    }

    /// <summary>Gasto total de cada uno de los últimos N meses (para el gráfico de barras), del más antiguo al actual.</summary>
    public async Task<List<(int Anio, int Mes, decimal Gasto)>> TendenciaMensualAsync(int meses, DateTime? referencia = null)
    {
        await _db.InicializarAsync();
        var fin = referencia ?? DateTime.Today;
        var resultado = new List<(int, int, decimal)>();
        for (var i = meses - 1; i >= 0; i--)
        {
            var mesFecha = new DateTime(fin.Year, fin.Month, 1).AddMonths(-i);
            var hasta = mesFecha.AddMonths(1);
            var movimientos = await _db.Connection.Table<Movimiento>()
                .Where(m => m.Fecha >= mesFecha && m.Fecha < hasta)
                .ToListAsync();
            var gasto = movimientos.Where(m => m.Tipo == TipoMovimiento.Gasto).Sum(m => m.Monto);
            resultado.Add((mesFecha.Year, mesFecha.Month, gasto));
        }
        return resultado;
    }
}
