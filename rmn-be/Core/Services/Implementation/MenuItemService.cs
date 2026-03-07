using Microsoft.EntityFrameworkCore;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Services.Interface;

namespace SEP_Restaurant_management.Core.Services.Implementation;

public class MenuItemService : IMenuItemService
{
    private readonly SepDatabaseContext _db;

    public MenuItemService(SepDatabaseContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<MenuItemDTO>> GetAllAsync(int? categoryId = null, bool includeInactive = false)
    {
        var query = _db.MenuItems
            .Include(m => m.Category)
            .AsQueryable();

        if (!includeInactive)
            query = query.Where(m => m.IsActive);

        if (categoryId.HasValue)
            query = query.Where(m => m.CategoryId == categoryId.Value);

        var items = await query
            .OrderByDescending(m => m.CreatedAt)
            .ToListAsync();

        return items.Select(m => ToDTO(m));
    }

    public async Task<MenuItemDTO?> GetByIdAsync(long id)
    {
        var item = await _db.MenuItems
            .Include(m => m.Category)
            .FirstOrDefaultAsync(m => m.ItemId == id);

        return item == null ? null : ToDTO(item);
    }

    public async Task<MenuItemDTO> CreateAsync(CreateMenuItemDTO dto)
    {
        if (await _db.MenuItems.AnyAsync(m => m.ItemName.ToLower() == dto.ItemName.ToLower()))
            throw new InvalidOperationException($"Tên món '{dto.ItemName}' đã tồn tại.");

        var item = new MenuItem
        {
            CategoryId  = dto.CategoryId,
            ItemName    = dto.ItemName,
            Description = dto.Description,
            BasePrice   = dto.BasePrice,
            Thumbnail   = dto.Thumbnail,
            IsActive    = true,
            CreatedAt   = DateTime.UtcNow,
        };

        _db.MenuItems.Add(item);
        await _db.SaveChangesAsync();

        await _db.Entry(item).Reference(m => m.Category).LoadAsync();
        return ToDTO(item);
    }

    public async Task<bool> UpdateAsync(long id, UpdateMenuItemDTO dto)
    {
        var item = await _db.MenuItems.FindAsync(id);
        if (item == null) return false;

        if (dto.CategoryId.HasValue)  item.CategoryId  = dto.CategoryId.Value;
        if (dto.ItemName  != null)    
        {
            if (dto.ItemName != item.ItemName && await _db.MenuItems.AnyAsync(m => m.ItemId != id && m.ItemName.ToLower() == dto.ItemName.ToLower()))
                throw new InvalidOperationException($"Tên món '{dto.ItemName}' đã tồn tại.");
            item.ItemName    = dto.ItemName;
        }
        if (dto.Description != null)  item.Description = dto.Description;
        if (dto.BasePrice.HasValue)   item.BasePrice   = dto.BasePrice.Value;
        if (dto.Thumbnail  != null)   item.Thumbnail   = dto.Thumbnail;
        if (dto.IsActive.HasValue)    item.IsActive    = dto.IsActive.Value;

        return await _db.SaveChangesAsync() > 0;
    }

    public async Task<bool> DeleteAsync(long id)
    {
        var item = await _db.MenuItems.FindAsync(id);
        if (item == null) return false;

        item.IsActive = false;
        return await _db.SaveChangesAsync() > 0;
    }

    private static MenuItemDTO ToDTO(MenuItem m) => new()
    {
        ItemId       = m.ItemId,
        CategoryId   = m.CategoryId,
        CategoryName = m.Category?.CategoryName ?? "",
        ItemName     = m.ItemName,
        Description  = m.Description,
        BasePrice    = m.BasePrice,
        Thumbnail    = m.Thumbnail,
        IsActive     = m.IsActive,
        CreatedAt    = m.CreatedAt,
    };
}
