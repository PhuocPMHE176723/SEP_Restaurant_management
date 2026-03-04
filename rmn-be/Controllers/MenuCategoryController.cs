using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Services.Interface;

namespace SEP_Restaurant_management.Controllers;

[Route("api/[controller]")]
[ApiController]
public class MenuCategoryController : BaseController
{
    private readonly IMenuCategoryService _categoryService;

    public MenuCategoryController(IMenuCategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    /// <summary>Lấy danh sách tất cả danh mục menu</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var categories = await _categoryService.GetAllAsync();
        return Success(categories);
    }

    /// <summary>Lấy thông tin một danh mục theo ID</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var category = await _categoryService.GetByIdAsync(id);
        if (category == null) return NotFoundResponse($"Category with ID {id} not found");
        return Success(category);
    }

    /// <summary>Tạo danh mục mới (Admin)</summary>
    [Authorize(Roles = "Admin")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateMenuCategoryDTO dto)
    {
        try
        {
            var created = await _categoryService.CreateAsync(dto);
            return Success(created, "Menu category created successfully");
        }
        catch (InvalidOperationException ex)
        {
            return Failure(ex.Message);
        }
    }

    /// <summary>Cập nhật danh mục (Admin)</summary>
    [Authorize(Roles = "Admin")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateMenuCategoryDTO dto)
    {
        try
        {
            var updated = await _categoryService.UpdateAsync(id, dto);
            if (!updated) return NotFoundResponse($"Category with ID {id} not found");
            return Success("Menu category updated successfully");
        }
        catch (InvalidOperationException ex)
        {
            return Failure(ex.Message);
        }
    }

    /// <summary>Xóa danh mục (soft delete, Admin)</summary>
    [Authorize(Roles = "Admin")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _categoryService.DeleteAsync(id);
        if (!deleted) return NotFoundResponse($"Category with ID {id} not found");
        return Success("Menu category deactivated successfully");
    }
}
