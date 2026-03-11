using SEP_Restaurant_management.Core.DTOs;

namespace SEP_Restaurant_management.Core.Services.Interface;

public interface IDiningTableService
{
    Task<IEnumerable<DiningTableDTO>> GetAllAsync();
    Task<IEnumerable<DiningTableWithOrderDTO>> GetAllWithOrdersAsync();
    Task<DiningTableDTO?> GetByIdAsync(int id);
    Task<DiningTableDTO> CreateAsync(CreateDiningTableDTO dto);
    Task<bool> UpdateAsync(int id, UpdateDiningTableDTO dto);
    Task<bool> DeleteAsync(int id);
}
