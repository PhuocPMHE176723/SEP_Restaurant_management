using AutoMapper;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Repositories.Interface;
using SEP_Restaurant_management.Core.Services.Interface;

namespace SEP_Restaurant_management.Core.Services.Implementation;

public class MenuCategoryService : IMenuCategoryService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;

    public MenuCategoryService(IUnitOfWork unitOfWork, IMapper mapper)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
    }

    public async Task<IEnumerable<MenuCategoryDTO>> GetAllAsync()
    {
        // Lấy tất cả category đã sắp xếp theo DisplayOrder
        var categories = await _unitOfWork.MenuCategories.GetOrderedAsync();
        return _mapper.Map<IEnumerable<MenuCategoryDTO>>(categories);
    }

    public async Task<MenuCategoryDTO?> GetByIdAsync(int id)
    {
        var category = await _unitOfWork.MenuCategories.GetByIdAsync(id);
        return category == null ? null : _mapper.Map<MenuCategoryDTO>(category);
    }

    public async Task<MenuCategoryDTO> CreateAsync(CreateMenuCategoryDTO dto)
    {
        var trimmedName = NormalizeName(dto.CategoryName);
        if (string.IsNullOrWhiteSpace(trimmedName))
            throw new InvalidOperationException("Tên danh mục không được để trống.");

        // Kiểm tra trùng tên
        if (await _unitOfWork.MenuCategories.IsNameExistsAsync(trimmedName))
            throw new InvalidOperationException($"Tên danh mục '{trimmedName}' đã tồn tại.");

        var category = _mapper.Map<MenuCategory>(dto);
        category.CategoryName = trimmedName;
        await _unitOfWork.MenuCategories.AddAsync(category);
        await _unitOfWork.SaveChangesAsync();

        return _mapper.Map<MenuCategoryDTO>(category);
    }

    public async Task<bool> UpdateAsync(int id, UpdateMenuCategoryDTO dto)
    {
        var category = await _unitOfWork.MenuCategories.GetByIdAsync(id);
        if (category == null)
            return false;

        // Kiểm tra trùng tên với category khác
        if (dto.CategoryName != null)
        {
            var trimmedName = NormalizeName(dto.CategoryName);
            if (string.IsNullOrWhiteSpace(trimmedName))
                throw new InvalidOperationException("Tên danh mục không được để trống.");

            if (await _unitOfWork.MenuCategories.IsNameExistsAsync(trimmedName, excludeId: id))
                throw new InvalidOperationException($"Tên danh mục '{trimmedName}' đã tồn tại.");

            category.CategoryName = trimmedName;
        }
        if (dto.Description != null)
            category.Description = dto.Description;
        if (dto.DisplayOrder.HasValue)
            category.DisplayOrder = dto.DisplayOrder.Value;
        if (dto.IsActive.HasValue)
            category.IsActive = dto.IsActive.Value;

        _unitOfWork.MenuCategories.Update(category);
        return await _unitOfWork.SaveChangesAsync() > 0;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var category = await _unitOfWork.MenuCategories.GetByIdAsync(id);
        if (category == null)
            return false;

        // Soft delete
        category.IsActive = false;
        _unitOfWork.MenuCategories.Update(category);
        return await _unitOfWork.SaveChangesAsync() > 0;
    }

    private static string NormalizeName(string name) => name.Trim();
}
