using System;
using System.ComponentModel.DataAnnotations;

namespace SEP_Restaurant_management.Core.Models;

public class BlogPost
{
    [Key]
    public int PostId { get; set; }

    [Required]
    [MaxLength(255)]
    public string Title { get; set; } = default!;

    [Required]
    public string Content { get; set; } = default!;

    [MaxLength(255)]
    public string? FeaturedImage { get; set; }

    public int CategoryId { get; set; }

    [MaxLength(20)]
    public string Status { get; set; } = "DRAFT"; 

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public virtual BlogCategory Category { get; set; } = default!;
}
