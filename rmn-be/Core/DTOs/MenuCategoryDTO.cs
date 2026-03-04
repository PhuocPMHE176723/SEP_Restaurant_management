using System.ComponentModel.DataAnnotations;

namespace SEP_Restaurant_management.Core.DTOs;

// ── MenuCategory DTOs ─────────────────────────────────────────────
public class MenuCategoryDTO
{
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = null!;
    public string? Description { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
}

public class CreateMenuCategoryDTO
{
    [Required]
    [MaxLength(100)]
    public string CategoryName { get; set; } = null!;

    [MaxLength(255)]
    public string? Description { get; set; }

    public int DisplayOrder { get; set; } = 0;
}

public class UpdateMenuCategoryDTO
{
    [MaxLength(100)]
    public string? CategoryName { get; set; }

    [MaxLength(255)]
    public string? Description { get; set; }

    public int? DisplayOrder { get; set; }
    public bool? IsActive { get; set; }
}
