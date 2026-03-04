using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Repositories.Interface;
using System.Collections;

namespace SEP_Restaurant_management.Core.Repositories.Implementation;

public class UnitOfWork : IUnitOfWork
{
    private readonly SepDatabaseContext _context;
    private Hashtable _repositories;

    // Specific repositories (lazy initialized)
    private IDiningTableRepository? _diningTables;
    private IMenuCategoryRepository? _menuCategories;

    public UnitOfWork(SepDatabaseContext context)
    {
        _context = context;
        _repositories = new Hashtable();
    }

    // ── Specific repositories ─────────────────────────────────────
    public IDiningTableRepository DiningTables
        => _diningTables ??= new DiningTableRepository(_context);

    public IMenuCategoryRepository MenuCategories
        => _menuCategories ??= new MenuCategoryRepository(_context);

    // ── Generic (fallback cho entity chưa có specific repo) ───────
    public IGenericRepository<T> GetRepository<T>() where T : class
    {
        var type = typeof(T).Name;

        if (!_repositories.ContainsKey(type))
        {
            var repositoryType = typeof(GenericRepository<>);
            var repositoryInstance = Activator.CreateInstance(repositoryType.MakeGenericType(typeof(T)), _context);
            _repositories.Add(type, repositoryInstance);
        }

        return (IGenericRepository<T>)_repositories[type]!;
    }

    public async Task<int> SaveChangesAsync()
    {
        return await _context.SaveChangesAsync();
    }

    public void Dispose()
    {
        _context.Dispose();
    }
}
