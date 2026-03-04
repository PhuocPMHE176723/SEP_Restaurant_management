using SEP_Restaurant_management.Core.DTOs;

namespace SEP_Restaurant_management.Core.Services.Interface;

public interface IMenuItemService
{
    Task<IEnumerable<MenuItemDTO>> GetAllAsync(int? categoryId = null, bool includeInactive = false);
    Task<MenuItemDTO?> GetByIdAsync(long id);
    Task<MenuItemDTO> CreateAsync(CreateMenuItemDTO dto);
    Task<bool> UpdateAsync(long id, UpdateMenuItemDTO dto);
    Task<bool> DeleteAsync(long id);
}
