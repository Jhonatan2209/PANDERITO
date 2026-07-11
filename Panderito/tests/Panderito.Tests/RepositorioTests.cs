using Panderito.Core.Data;
using Panderito.Core.Models;

namespace Panderito.Tests;

public class RepositorioTests
{
    [Fact]
    public async Task GuardarYLeer_Cuenta()
    {
        await using var bd = new BaseDeDatosTemporal();
        var repo = new Repository<Cuenta>(bd.Db);

        var id = await repo.SaveAsync(new Cuenta { Nombre = "Yape", Tipo = TipoCuenta.Yape, SaldoInicial = 50m });

        Assert.True(id > 0);
        var leida = await repo.GetByIdAsync(id);
        Assert.NotNull(leida);
        Assert.Equal("Yape", leida!.Nombre);
        Assert.Equal(TipoCuenta.Yape, leida.Tipo);
        Assert.Equal(50m, leida.SaldoInicial);
    }

    [Fact]
    public async Task Actualizar_Cuenta()
    {
        await using var bd = new BaseDeDatosTemporal();
        var repo = new Repository<Cuenta>(bd.Db);
        var id = await repo.SaveAsync(new Cuenta { Nombre = "Banco", Tipo = TipoCuenta.Banco });

        var cuenta = await repo.GetByIdAsync(id);
        cuenta!.Nombre = "BCP";
        await repo.SaveAsync(cuenta);

        var actualizada = await repo.GetByIdAsync(id);
        Assert.Equal("BCP", actualizada!.Nombre);
    }

    [Fact]
    public async Task Borrar_Cuenta()
    {
        await using var bd = new BaseDeDatosTemporal();
        var repo = new Repository<Cuenta>(bd.Db);
        var id = await repo.SaveAsync(new Cuenta { Nombre = "Temporal" });

        var cuenta = await repo.GetByIdAsync(id);
        await repo.DeleteAsync(cuenta!);

        Assert.Null(await repo.GetByIdAsync(id));
    }

    [Fact]
    public async Task CrudBasico_TodasLasEntidades()
    {
        await using var bd = new BaseDeDatosTemporal();

        var movimientos = new Repository<Movimiento>(bd.Db);
        var idMov = await movimientos.SaveAsync(new Movimiento { Monto = 12.5m, Tipo = TipoMovimiento.Gasto, CategoriaId = 1, CuentaId = 1, Nota = "menú" });
        Assert.NotNull(await movimientos.GetByIdAsync(idMov));

        var prestamos = new Repository<Prestamo>(bd.Db);
        var idPre = await prestamos.SaveAsync(new Prestamo { Persona = "Ana", Monto = 100m, Tipo = TipoPrestamo.PorCobrar });
        Assert.NotNull(await prestamos.GetByIdAsync(idPre));

        var abonos = new Repository<AbonoPrestamo>(bd.Db);
        var idAbo = await abonos.SaveAsync(new AbonoPrestamo { PrestamoId = idPre, Monto = 40m });
        Assert.NotNull(await abonos.GetByIdAsync(idAbo));

        var panderos = new Repository<Pandero>(bd.Db);
        var idPan = await panderos.SaveAsync(new Pandero { Nombre = "Oficina", NumParticipantes = 10, CuotaMonto = 200m });
        Assert.NotNull(await panderos.GetByIdAsync(idPan));

        var turnos = new Repository<TurnoPandero>(bd.Db);
        var idTur = await turnos.SaveAsync(new TurnoPandero { PanderoId = idPan, NumeroTurno = 1, NombreParticipante = "Lucía" });
        Assert.NotNull(await turnos.GetByIdAsync(idTur));

        var metas = new Repository<MetaAhorro>(bd.Db);
        var idMet = await metas.SaveAsync(new MetaAhorro { Nombre = "Laptop", MontoMeta = 3000m, MontoActual = 500m });
        Assert.NotNull(await metas.GetByIdAsync(idMet));

        var recurrentes = new Repository<GastoRecurrente>(bd.Db);
        var idRec = await recurrentes.SaveAsync(new GastoRecurrente { Nombre = "Internet", Monto = 90m, CategoriaId = 4, CuentaId = 1, ProximaFecha = DateTime.Today.AddDays(5) });
        Assert.NotNull(await recurrentes.GetByIdAsync(idRec));

        var presupuestos = new Repository<Presupuesto>(bd.Db);
        var idPres = await presupuestos.SaveAsync(new Presupuesto { CategoriaId = 1, MontoLimite = 400m });
        Assert.NotNull(await presupuestos.GetByIdAsync(idPres));
    }

    [Fact]
    public async Task Seed_CreaCategoriasYCuentaEfectivo()
    {
        await using var bd = new BaseDeDatosTemporal();
        await bd.Db.InicializarAsync();

        var categorias = await new Repository<Categoria>(bd.Db).GetAllAsync();
        var cuentas = await new Repository<Cuenta>(bd.Db).GetAllAsync();

        Assert.Equal(11, categorias.Count);
        Assert.Contains(categorias, c => c.Nombre == "Menú/Comida" && c.TipoMovimiento == TipoMovimiento.Gasto);
        Assert.Contains(categorias, c => c.Nombre == "Sueldo" && c.TipoMovimiento == TipoMovimiento.Ingreso);
        Assert.Single(cuentas);
        Assert.Equal("Efectivo", cuentas[0].Nombre);
    }

    [Fact]
    public async Task Seed_NoDuplicaEnSegundoArranque()
    {
        await using var bd = new BaseDeDatosTemporal();
        await bd.Db.InicializarAsync();
        await SembradorDatos.SembrarSiVacioAsync(bd.Db.Connection);

        var categorias = await new Repository<Categoria>(bd.Db).GetAllAsync();
        Assert.Equal(11, categorias.Count);
    }
}
