using SEP_Restaurant_management.Core.Models;

namespace SEP_Restaurant_management.Core.Repositories.Interface;

public interface IDiningTableRepository : IGenericRepository<DiningTable>
{
    Task<IEnumerable<DiningTable>> GetAvailableTablesAsync();
    Task<IEnumerable<DiningTable>> GetActiveTablesAsync();
    Task<DiningTable?> GetByCodeAsync(string tableCode);
    Task<bool> IsCodeExistsAsync(string tableCode, int? excludeId = null);
    Task<IEnumerable<DiningTable>> GetTablesWithCurrentOrdersAsync();
}
