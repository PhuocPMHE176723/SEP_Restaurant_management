using Microsoft.EntityFrameworkCore;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Repositories.Interface;

namespace SEP_Restaurant_management.Core.Repositories.Implementation;

public class MenuCategoryRepository : GenericRepository<MenuCategory>, IMenuCategoryRepository
{
    public MenuCategoryRepository(SepDatabaseContext context) : base(context)
    {
    }

    /// <summary>Lấy danh sách category đang active</summary>
    public async Task<IEnumerable<MenuCategory>> GetActiveAsync()
    {
        return await _dbSet
            .Where(c => c.IsActive)
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.CategoryName)
            .ToListAsync();
    }

    /// <summary>Lấy tất cả category đã sắp xếp theo DisplayOrder</summary>
    public async Task<IEnumerable<MenuCategory>> GetOrderedAsync()
    {
        return await _dbSet
            .OrderBy(c => c.DisplayOrder)
            .ThenBy(c => c.CategoryName)
            .ToListAsync();
    }

    /// <summary>Lấy category kèm danh sách món ăn (eager loading)</summary>
    public async Task<MenuCategory?> GetWithItemsAsync(int categoryId)
    {
        return await _dbSet
            .Include(c => c.MenuItems.Where(i => i.IsActive))
            .FirstOrDefaultAsync(c => c.CategoryId == categoryId);
    }

    /// <summary>Kiểm tra tên category đã tồn tại chưa</summary>
    public async Task<bool> IsNameExistsAsync(string name, int? excludeId = null)
    {
        return await _dbSet.AnyAsync(c =>
            c.CategoryName == name &&
            (excludeId == null || c.CategoryId != excludeId));
    }
}
