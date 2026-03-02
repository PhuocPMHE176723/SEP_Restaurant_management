namespace SEP_Restaurant_management.Core.Repositories.Interface;

public interface IUnitOfWork : IDisposable
{
    IGenericRepository<T> GetRepository<T>() where T : class;
    Task<int> SaveChangesAsync();
}
