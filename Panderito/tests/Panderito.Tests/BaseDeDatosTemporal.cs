using Panderito.Core.Data;

namespace Panderito.Tests;

/// <summary>Crea una BD SQLite en archivo temporal por prueba y la elimina al final.</summary>
public sealed class BaseDeDatosTemporal : IAsyncDisposable
{
    public PanderitoDatabase Db { get; }
    private readonly string _ruta;

    public BaseDeDatosTemporal()
    {
        _ruta = Path.Combine(Path.GetTempPath(), $"panderito_test_{Guid.NewGuid():N}.db3");
        Db = new PanderitoDatabase(_ruta);
    }

    public async ValueTask DisposeAsync()
    {
        await Db.CerrarAsync();
        if (File.Exists(_ruta))
            File.Delete(_ruta);
    }
}
