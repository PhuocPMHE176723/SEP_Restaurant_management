using Microsoft.EntityFrameworkCore;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Repositories.Interface;

namespace SEP_Restaurant_management.Core.Repositories.Implementation;

public class DiningTableRepository : GenericRepository<DiningTable>, IDiningTableRepository
{
    public DiningTableRepository(SepDatabaseContext context) : base(context)
    {
    }

    /// <summary>Lấy danh sách bàn đang available (Status=AVAILABLE và IsActive=true)</summary>
    public async Task<IEnumerable<DiningTable>> GetAvailableTablesAsync()
    {
        return await _dbSet
            .Where(t => t.IsActive && t.Status == "AVAILABLE")
            .OrderBy(t => t.TableCode)
            .ToListAsync();
    }

    /// <summary>Lấy tất cả bàn đang active (IsActive=true)</summary>
    public async Task<IEnumerable<DiningTable>> GetActiveTablesAsync()
    {
        return await _dbSet
            .Where(t => t.IsActive)
            .OrderBy(t => t.TableCode)
            .ToListAsync();
    }

    /// <summary>Tìm bàn theo mã TableCode</summary>
    public async Task<DiningTable?> GetByCodeAsync(string tableCode)
    {
        return await _dbSet
            .FirstOrDefaultAsync(t => t.TableCode == tableCode);
    }

    /// <summary>Kiểm tra TableCode đã tồn tại chưa (dùng khi create/update)</summary>
    public async Task<bool> IsCodeExistsAsync(string tableCode, int? excludeId = null)
    {
        return await _dbSet.AnyAsync(t =>
            t.TableCode == tableCode &&
            (excludeId == null || t.TableId != excludeId));
    }

    /// <summary>Lấy danh sách bàn cùng với order hiện tại (nếu có)</summary>
    public async Task<IEnumerable<DiningTable>> GetTablesWithCurrentOrdersAsync()
    {
        return await _dbSet
            .Where(t => t.IsActive)
            .Include(t => t.Orders.Where(o => o.Status != "CLOSED" && o.Status != "CANCELLED"))
            .OrderBy(t => t.TableCode)
            .ToListAsync();
    }
}
