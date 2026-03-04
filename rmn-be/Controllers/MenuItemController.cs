using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Services.Interface;

namespace SEP_Restaurant_management.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MenuItemController : BaseController
{
    private readonly IMenuItemService _menuItemService;
    private readonly ICloudinaryService _cloudinaryService;

    public MenuItemController(IMenuItemService menuItemService, ICloudinaryService cloudinaryService)
    {
        _menuItemService = menuItemService;
        _cloudinaryService = cloudinaryService;
    }

    /// <summary>Get all menu items (optionally filter by categoryId)</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? categoryId, [FromQuery] bool includeInactive = false)
    {
        var items = await _menuItemService.GetAllAsync(categoryId, includeInactive);
        return Success(items, "Menu items retrieved successfully");
    }

    /// <summary>Get a single menu item by ID</summary>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(long id)
    {
        var item = await _menuItemService.GetByIdAsync(id);
        if (item == null)
            return NotFoundResponse("Menu item not found");

        return Success(item);
    }

    /// <summary>Create a new menu item (Admin only)</summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateMenuItemDTO dto)
    {
        if (!ModelState.IsValid)
            return Failure("Invalid data");

        var item = await _menuItemService.CreateAsync(dto);
        return Success(item, "Menu item created successfully");
    }

    /// <summary>Update an existing menu item (Admin only)</summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(long id, [FromBody] UpdateMenuItemDTO dto)
    {
        if (!ModelState.IsValid)
            return Failure("Invalid data");

        var success = await _menuItemService.UpdateAsync(id, dto);
        if (!success)
            return NotFoundResponse("Menu item not found");

        return Success("Menu item updated successfully");
    }

    /// <summary>Soft-delete a menu item (set IsActive = false) (Admin only)</summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(long id)
    {
        var success = await _menuItemService.DeleteAsync(id);
        if (!success)
            return NotFoundResponse("Menu item not found");

        return Success("Menu item deleted successfully");
    }

    /// <summary>Upload an image to Cloudinary and return the URL (Admin only)</summary>
    [HttpPost("upload-image")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UploadImage(IFormFile file)
    {
        // Validate input
        if (file == null || file.Length == 0)
            return Failure("No file uploaded");

        // Check file size (max 5MB)
        const long maxSize = 5 * 1024 * 1024;
        if (file.Length > maxSize)
            return Failure("File size exceeds 5MB limit");

        // Check file type (only images)
        var allowedTypes = new[] { "image/jpeg", "image/png", "image/jpg", "image/webp" };
        if (!allowedTypes.Contains(file.ContentType.ToLower()))
            return Failure("Only image files (JPEG, PNG, WebP) are allowed");

        try
        {
            var imageUrl = await _cloudinaryService.UploadImageAsync(file, "menu-items");
            return Success(new { url = imageUrl }, "Image uploaded successfully");
        }
        catch (Exception ex)
        {
            return Failure($"Upload failed: {ex.Message}");
        }
    }
}
