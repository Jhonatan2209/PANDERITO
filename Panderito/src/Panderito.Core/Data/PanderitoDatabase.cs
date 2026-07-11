using Panderito.Core.Models;
using SQLite;

namespace Panderito.Core.Data;

/// <summary>
/// Conexión SQLite única de la app, con inicialización perezosa.
/// La ruta del archivo la provee el head (MAUI: FileSystem.AppDataDirectory)
/// para que esta biblioteca no dependa de MAUI y sea testeable.
/// </summary>
public class PanderitoDatabase
{
    private readonly string _dbPath;
    private SQLiteAsyncConnection? _connection;
    private Task? _initTask;
    private readonly object _initLock = new();

    public const string NombreArchivo = "panderito.db3";

    public PanderitoDatabase(string dbPath)
    {
        _dbPath = dbPath;
    }

    public SQLiteAsyncConnection Connection =>
        _connection ??= new SQLiteAsyncConnection(
            _dbPath,
            SQLiteOpenFlags.ReadWrite | SQLiteOpenFlags.Create | SQLiteOpenFlags.SharedCache);

    /// <summary>Crea las tablas (una sola vez) y siembra datos por defecto si la BD está vacía.</summary>
    public Task InicializarAsync()
    {
        lock (_initLock)
        {
            _initTask ??= InicializarInternoAsync();
        }
        return _initTask;
    }

    private async Task InicializarInternoAsync()
    {
        var conn = Connection;
        await conn.CreateTableAsync<Cuenta>();
        await conn.CreateTableAsync<Categoria>();
        await conn.CreateTableAsync<Movimiento>();
        await conn.CreateTableAsync<Prestamo>();
        await conn.CreateTableAsync<AbonoPrestamo>();
        await conn.CreateTableAsync<Pandero>();
        await conn.CreateTableAsync<TurnoPandero>();
        await conn.CreateTableAsync<MetaAhorro>();
        await conn.CreateTableAsync<GastoRecurrente>();
        await conn.CreateTableAsync<Presupuesto>();

        await SembradorDatos.SembrarSiVacioAsync(conn);
    }

    public async Task CerrarAsync()
    {
        if (_connection is not null)
        {
            await _connection.CloseAsync();
            _connection = null;
            lock (_initLock) { _initTask = null; }
        }
    }
}
