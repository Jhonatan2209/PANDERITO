using Chanchito.Core.Data;

namespace Chanchito.Tests;

/// <summary>Crea una BD SQLite en archivo temporal por prueba y la elimina al final.</summary>
public sealed class BaseDeDatosTemporal : IAsyncDisposable
{
    public ChanchitoDatabase Db { get; }
    private readonly string _ruta;

    public BaseDeDatosTemporal()
    {
        _ruta = Path.Combine(Path.GetTempPath(), $"chanchito_test_{Guid.NewGuid():N}.db3");
        Db = new ChanchitoDatabase(_ruta);
    }

    public async ValueTask DisposeAsync()
    {
        await Db.CerrarAsync();
        if (File.Exists(_ruta))
            File.Delete(_ruta);
    }
}
