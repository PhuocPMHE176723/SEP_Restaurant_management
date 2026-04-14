using rmn_be.Core.DTOs;

namespace rmn_be.Core.Services.Interface
{
    public interface IStaffService
    {
        Task<PagedResultDTO<StaffDTO>> GetAllStaffAsync(PagingRequestDTO pagingRequest);
        Task<StaffDTO?> GetStaffByIdAsync(long id);
        Task<StaffDTO> CreateStaffAsync(CreateStaffDTO createDto);
        Task<bool> UpdateStaffAsync(long id, UpdateStaffDTO updateDto);
        Task<bool> LockStaffAccountAsync(long staffId);
        Task<bool> UnlockStaffAccountAsync(long staffId);
        Task<StaffDTO?> GetMyProfileAsync(string userId);
    }
}
