using Panderito.Core.Data;
using Panderito.Core.Models;

namespace Panderito.Core.Services;

public record GastoPorCategoria(int CategoriaId, string Nombre, string Icono, string ColorHex, decimal Total);

/// <summary>Movimiento con su categoría y cuenta ya resueltas, listo para mostrar en la UI.</summary>
public record MovimientoDetalle(Movimiento Movimiento, Categoria? Categoria, Cuenta? Cuenta)
{
    public string NombreCategoria => Categoria?.Nombre ?? "Sin categoría";
    public string IconoCategoria => Categoria?.Icono ?? "🏷️";
    public string ColorCategoria => Categoria?.ColorHex ?? "#6B7280";
    public string NombreCuenta => Cuenta?.Nombre ?? "—";
    public bool EsGasto => Movimiento.Tipo == TipoMovimiento.Gasto;
    public string MontoTexto => FormatoMoneda.ConSigno(Movimiento.Monto, EsGasto);
    public string FechaTexto => Movimiento.Fecha.ToString("dd MMM yyyy · HH:mm", FormatoMoneda.CulturaPeru);
}

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
    private readonly PanderitoDatabase _db;

    public ServicioMovimientos(PanderitoDatabase db)
    {
        _db = db;
    }

    public async Task GuardarAsync(Movimiento movimiento)
    {
        await _db.InicializarAsync();
        if (movimiento.Id == 0)
            await _db.Connection.InsertAsync(movimiento);
        else
            await _db.Connection.UpdateAsync(movimiento);
    }

    public async Task EliminarAsync(Movimiento movimiento)
    {
        await _db.InicializarAsync();
        await _db.Connection.DeleteAsync(movimiento);
    }

    public async Task<MovimientoDetalle?> ObtenerDetalleAsync(int id)
    {
        await _db.InicializarAsync();
        var movimiento = await _db.Connection.FindAsync<Movimiento>(id);
        if (movimiento is null) return null;
        return (await ConDetalleAsync(new List<Movimiento> { movimiento }))[0];
    }

    public async Task<List<MovimientoDetalle>> RecientesConDetalleAsync(int cantidad = 10) =>
        await ConDetalleAsync(await ObtenerRecientesAsync(cantidad));

    public async Task<List<MovimientoDetalle>> BuscarConDetalleAsync(FiltroMovimientos filtro) =>
        await ConDetalleAsync(await BuscarAsync(filtro));

    private async Task<List<MovimientoDetalle>> ConDetalleAsync(List<Movimiento> movimientos)
    {
        var categorias = await _db.Connection.Table<Categoria>().ToListAsync();
        var cuentas = await _db.Connection.Table<Cuenta>().ToListAsync();
        return movimientos
            .Select(m => new MovimientoDetalle(
                m,
                categorias.FirstOrDefault(c => c.Id == m.CategoriaId),
                cuentas.FirstOrDefault(c => c.Id == m.CuentaId)))
            .ToList();
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
