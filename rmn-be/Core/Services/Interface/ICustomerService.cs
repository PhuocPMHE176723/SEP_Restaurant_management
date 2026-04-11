using rmn_be.Core.DTOs;
using static rmn_be.Core.DTOs.CustomerOrderDTO;

namespace rmn_be.Core.Services.Interface
{
    public interface ICustomerService
    {
        Task<PagedResultDTO<CustomerDTO>> GetAllCustomersAsync(PagingRequestDTO pagingRequest);
        Task<CustomerDTO?> GetCustomerByIdAsync(long id);
        Task<CustomerDTO> CreateCustomerAsync(CreateCustomerDTO createDto);
        Task<bool> UpdateCustomerAsync(long id, UpdateCustomerDTO updateDto);
        Task<CustomerDTO?> GetMyProfileAsync(string userId);
        Task<CustomerContextDTO> GetMyContextAsync(string userId);
    }
}
