using rmn_be.Core.DTOs;

namespace rmn_be.Core.Services.Interface
{
    public interface IServingService
    {
        Task<List<ServingItemDTO>> GetServingListAsync();
        Task<List<ServingTableDTO>> GetServingTablesAsync(long itemId);
        Task<bool> ServeReadyItemAsync(long itemId, long orderId, int quantity);
        Task<bool> ReassignReadyItemAsync(long itemId, long fromOrderId, long toOrderId, int quantity);
    }
}
