namespace SEP_Restaurant_management.Core.DTOs;

// ── MenuItem DTOs ─────────────────────────────────────────────
public class MenuItemDTO
{
    public long ItemId { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = null!;
    public string ItemName { get; set; } = null!;
    public string? Description { get; set; }
    public decimal BasePrice { get; set; }
    public string? Thumbnail { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateMenuItemDTO
{
    public int CategoryId { get; set; }
    public string ItemName { get; set; } = null!;
    public string? Description { get; set; }
    public decimal BasePrice { get; set; }
    public string? Thumbnail { get; set; }   // URL từ Cloudinary (upload trước)
}

public class UpdateMenuItemDTO
{
    public int? CategoryId { get; set; }
    public string? ItemName { get; set; }
    public string? Description { get; set; }
    public decimal? BasePrice { get; set; }
    public string? Thumbnail { get; set; }
    public bool? IsActive { get; set; }
}
