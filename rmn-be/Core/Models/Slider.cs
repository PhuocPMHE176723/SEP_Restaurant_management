using System;
using System.ComponentModel.DataAnnotations;

namespace SEP_Restaurant_management.Core.Models;

public class Slider
{
    [Key]
    public int SliderId { get; set; }

    [Required]
    [MaxLength(255)]
    public string ImageUrl { get; set; } = default!;

    [MaxLength(150)]
    public string? Title { get; set; }

    [MaxLength(255)]
    public string? Link { get; set; }

    public int DisplayOrder { get; set; } = 0;

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
