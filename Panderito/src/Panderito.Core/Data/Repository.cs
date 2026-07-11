namespace Panderito.Core.Data;

/// <summary>Repositorio genérico CRUD sobre la conexión SQLite de la app.</summary>
public class Repository<T> where T : new()
{
    protected readonly PanderitoDatabase Db;

    public Repository(PanderitoDatabase db)
    {
        Db = db;
    }

    public async Task<List<T>> GetAllAsync()
    {
        await Db.InicializarAsync();
        return await Db.Connection.Table<T>().ToListAsync();
    }

    public async Task<T?> GetByIdAsync(int id)
    {
        await Db.InicializarAsync();
        return await Db.Connection.FindAsync<T>(id);
    }

    /// <summary>Inserta si el Id es 0; actualiza en caso contrario. Devuelve el Id.</summary>
    public async Task<int> SaveAsync(T item)
    {
        await Db.InicializarAsync();
        var idProp = typeof(T).GetProperty("Id");
        var id = (int)(idProp?.GetValue(item) ?? 0);
        if (id == 0)
        {
            await Db.Connection.InsertAsync(item);
            return (int)(idProp?.GetValue(item) ?? 0);
        }
        await Db.Connection.UpdateAsync(item);
        return id;
    }

    public async Task<int> DeleteAsync(T item)
    {
        await Db.InicializarAsync();
        return await Db.Connection.DeleteAsync(item);
    }
}
