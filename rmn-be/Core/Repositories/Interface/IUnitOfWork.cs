namespace SEP_Restaurant_management.Core.Repositories.Interface;

public interface IUnitOfWork : IDisposable
{
    // Generic – dùng cho entity chưa có specific repository
    IGenericRepository<T> GetRepository<T>() where T : class;

    // Specific repositories
    IDiningTableRepository DiningTables { get; }
    IMenuCategoryRepository MenuCategories { get; }

    Task<int> SaveChangesAsync();
}
