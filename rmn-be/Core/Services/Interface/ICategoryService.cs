using SEP_Restaurant_management.Core.DTOs;

namespace SEP_Restaurant_management.Core.Services.Interface;

public interface ICategoryService
{
    Task<IEnumerable<CategoryDTO>> GetAllCategoriesAsync();
    Task<CategoryDTO?> GetCategoryByIdAsync(int id);
    Task<CategoryDTO> CreateCategoryAsync(CreateCategoryDTO createDto);
    Task<bool> UpdateCategoryAsync(int id, UpdateCategoryDTO updateDto);
    Task<bool> DeleteCategoryAsync(int id);
}
