using Panderito.Core.Models;
using SQLite;

namespace Panderito.Core.Data;

/// <summary>Siembra categorías por defecto y la cuenta "Efectivo" en el primer arranque.</summary>
public static class SembradorDatos
{
    public static async Task SembrarSiVacioAsync(SQLiteAsyncConnection conn)
    {
        var hayCategorias = await conn.Table<Categoria>().CountAsync() > 0;
        if (!hayCategorias)
        {
            var categorias = new List<Categoria>
            {
                // Gastos
                new() { Nombre = "Menú/Comida",     TipoMovimiento = TipoMovimiento.Gasto,   Icono = "🍽️", ColorHex = "#F97316" },
                new() { Nombre = "Transporte",      TipoMovimiento = TipoMovimiento.Gasto,   Icono = "🚌", ColorHex = "#3B82F6" },
                new() { Nombre = "Mercado",         TipoMovimiento = TipoMovimiento.Gasto,   Icono = "🛒", ColorHex = "#10B981" },
                new() { Nombre = "Servicios",       TipoMovimiento = TipoMovimiento.Gasto,   Icono = "💡", ColorHex = "#EAB308" },
                new() { Nombre = "Salud",           TipoMovimiento = TipoMovimiento.Gasto,   Icono = "💊", ColorHex = "#EF4444" },
                new() { Nombre = "Entretenimiento", TipoMovimiento = TipoMovimiento.Gasto,   Icono = "🎬", ColorHex = "#8B5CF6" },
                new() { Nombre = "Otros",           TipoMovimiento = TipoMovimiento.Gasto,   Icono = "📦", ColorHex = "#6B7280" },
                // Ingresos
                new() { Nombre = "Sueldo",            TipoMovimiento = TipoMovimiento.Ingreso, Icono = "💼", ColorHex = "#22C55E" },
                new() { Nombre = "Venta",             TipoMovimiento = TipoMovimiento.Ingreso, Icono = "🏷️", ColorHex = "#14B8A6" },
                new() { Nombre = "Préstamo recibido", TipoMovimiento = TipoMovimiento.Ingreso, Icono = "🤝", ColorHex = "#F59E0B" },
                new() { Nombre = "Otros",             TipoMovimiento = TipoMovimiento.Ingreso, Icono = "💰", ColorHex = "#84CC16" }
            };
            await conn.InsertAllAsync(categorias);
        }

        var hayCuentas = await conn.Table<Cuenta>().CountAsync() > 0;
        if (!hayCuentas)
        {
            await conn.InsertAsync(new Cuenta
            {
                Nombre = "Efectivo",
                Tipo = TipoCuenta.Efectivo,
                SaldoInicial = 0m,
                Icono = "💵",
                ColorHex = "#22C55E",
                Activa = true
            });
        }
    }
}
