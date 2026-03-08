using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Services.Interface;

namespace SEP_Restaurant_management.Controllers;

[Route("api/[controller]")]
[ApiController]
public class CategoryController : BaseController
{
    private readonly ICategoryService _categoryService;

    public CategoryController(ICategoryService categoryService)
    {
        _categoryService = categoryService;
    }

    [HttpGet]
    public async Task<IActionResult> GetCategories()
    {
        var categories = await _categoryService.GetAllCategoriesAsync();
        return Success(categories);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetCategory(int id)
    {
        var category = await _categoryService.GetCategoryByIdAsync(id);
        if (category == null) return NotFoundResponse($"Category with ID {id} not found");
        return Success(category);
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost]
    public async Task<IActionResult> CreateCategory(CreateCategoryDTO createDto)
    {
        try 
        {
            var category = await _categoryService.CreateCategoryAsync(createDto);
            return Success(category, "Category created successfully");
        }
        catch (InvalidOperationException ex)
        {
            return Failure(ex.Message);
        }
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateCategory(int id, UpdateCategoryDTO updateDto)
    {
        try
        {
            var updated = await _categoryService.UpdateCategoryAsync(id, updateDto);
            if (!updated) return NotFoundResponse($"Category with ID {id} not found");
            return Success("Category updated successfully");
        }
        catch (InvalidOperationException ex)
        {
            return Failure(ex.Message);
        }
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        var deleted = await _categoryService.DeleteCategoryAsync(id);
        if (!deleted) return NotFoundResponse($"Category with ID {id} not found");
        return Success("Category deleted successfully");
    }
}
