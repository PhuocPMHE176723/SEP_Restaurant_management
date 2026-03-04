using SEP_Restaurant_management.Core.Models;

namespace SEP_Restaurant_management.Core.Repositories.Interface;

public interface IMenuCategoryRepository : IGenericRepository<MenuCategory>
{
    Task<IEnumerable<MenuCategory>> GetActiveAsync();
    Task<IEnumerable<MenuCategory>> GetOrderedAsync();
    Task<MenuCategory?> GetWithItemsAsync(int categoryId);
    Task<bool> IsNameExistsAsync(string name, int? excludeId = null);
}
