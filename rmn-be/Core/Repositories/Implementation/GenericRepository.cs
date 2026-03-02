using Microsoft.EntityFrameworkCore;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Repositories.Interface;
using System.Linq.Expressions;

namespace SEP_Restaurant_management.Core.Repositories.Implementation;

public class GenericRepository<T> : IGenericRepository<T> where T : class
{
    protected readonly SepDatabaseContext _context;
    protected readonly DbSet<T> _dbSet;

    public GenericRepository(SepDatabaseContext context)
    {
        _context = context;
        _dbSet = context.Set<T>();
    }

    public async Task<IEnumerable<T>> GetAllAsync()
    {
        return await _dbSet.ToListAsync();
    }

    public async Task<T?> GetByIdAsync(object id)
    {
        return await _dbSet.FindAsync(id);
    }

    public async Task<IEnumerable<T>> FindAsync(Expression<Func<T, bool>> predicate)
    {
        return await _dbSet.Where(predicate).ToListAsync();
    }

    public async Task AddAsync(T entity)
    {
        await _dbSet.AddAsync(entity);
    }

    public void Update(T entity)
    {
        _dbSet.Attach(entity);
        _context.Entry(entity).State = EntityState.Modified;
    }

    public void Delete(T entity)
    {
        if (_context.Entry(entity).State == EntityState.Detached)
        {
            _dbSet.Attach(entity);
        }
        _dbSet.Remove(entity);
    }
}
