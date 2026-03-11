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

    [MaxLength(500)]
    public string? Excerpt { get; set; }

    [MaxLength(255)]
    public string? FeaturedImage { get; set; }

    public int CategoryId { get; set; }

    [MaxLength(20)]
    public string Status { get; set; } = "DRAFT"; // DRAFT, PUBLISHED, ARCHIVED

    public string? Tags { get; set; } // Comma separated tags

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? PublishedAt { get; set; }

    public string? AuthorId { get; set; }

    // Navigation
    public virtual BlogCategory Category { get; set; } = default!;
    public virtual UserIdentity? Author { get; set; }
}
