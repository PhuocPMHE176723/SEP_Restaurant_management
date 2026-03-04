using SEP_Restaurant_management.Core.DTOs;

namespace SEP_Restaurant_management.Core.Services.Interface;

public interface IMenuCategoryService
{
    Task<IEnumerable<MenuCategoryDTO>> GetAllAsync();
    Task<MenuCategoryDTO?> GetByIdAsync(int id);
    Task<MenuCategoryDTO> CreateAsync(CreateMenuCategoryDTO dto);
    Task<bool> UpdateAsync(int id, UpdateMenuCategoryDTO dto);
    Task<bool> DeleteAsync(int id);
}
