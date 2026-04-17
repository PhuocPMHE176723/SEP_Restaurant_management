using rmn_be.Core.DTOs;

namespace rmn_be.Core.Services.Interface
{
    public interface IKitchen2Service
    {
        Task<List<CookingListItemDTO>> GetCookingListAsync();
        Task<bool> StartCookingByItemAsync(long itemId);
        Task<bool> MarkReadyServeByItemAsync(long itemId);
    }
}
