using AutoMapper;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Repositories.Interface;
using SEP_Restaurant_management.Core.Services.Interface;

namespace SEP_Restaurant_management.Core.Services.Implementation;

public class CategoryService : ICategoryService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public CategoryService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<IEnumerable<CategoryDTO>> GetAllCategoriesAsync()
    {
        var categories = await _unitOfWork.GetRepository<Category>().GetAllAsync();
        return _mapper.Map<IEnumerable<CategoryDTO>>(categories);
    }

    public async Task<CategoryDTO?> GetCategoryByIdAsync(int id)
    {
        var category = await _unitOfWork.GetRepository<Category>().GetByIdAsync(id);
        return _mapper.Map<CategoryDTO>(category);
    }

    public async Task<CategoryDTO> CreateCategoryAsync(CreateCategoryDTO createDto)
    {
        var category = _mapper.Map<Category>(createDto);
        category.CreatedAt = DateTime.Now;
        
        await _unitOfWork.GetRepository<Category>().AddAsync(category);
        await _unitOfWork.SaveChangesAsync();
        
        return _mapper.Map<CategoryDTO>(category);
    }

    public async Task<bool> UpdateCategoryAsync(int id, UpdateCategoryDTO updateDto)
    {
        var existingCategory = await _unitOfWork.GetRepository<Category>().GetByIdAsync(id);
        if (existingCategory == null) return false;

        _mapper.Map(updateDto, existingCategory);
        existingCategory.UpdatedAt = DateTime.Now;

        _unitOfWork.GetRepository<Category>().Update(existingCategory);
        var result = await _unitOfWork.SaveChangesAsync();
        
        return result > 0;
    }

    public async Task<bool> DeleteCategoryAsync(int id)
    {
        var category = await _unitOfWork.GetRepository<Category>().GetByIdAsync(id);
        if (category == null) return false;

        _unitOfWork.GetRepository<Category>().Delete(category);
        var result = await _unitOfWork.SaveChangesAsync();
        
        return result > 0;
    }
}
