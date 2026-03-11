using System;

namespace SEP_Restaurant_management.Core.DTOs;

public class BlogCategoryDTO
{
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = default!;
    public string? Description { get; set; }
    public bool IsActive { get; set; }
}

public class BlogPostDTO
{
    public int PostId { get; set; }
    public string Title { get; set; } = default!;
    public string Content { get; set; } = default!;
    public string? Excerpt { get; set; }
    public string? FeaturedImage { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = default!;
    public string Status { get; set; } = default!;
    public string? Tags { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? PublishedAt { get; set; }
    public string? AuthorName { get; set; }
}

public class CreateBlogPostDTO
{
    public string Title { get; set; } = default!;
    public string Content { get; set; } = default!;
    public string? Excerpt { get; set; }
    public string? FeaturedImage { get; set; }
    public int CategoryId { get; set; }
    public string Status { get; set; } = "DRAFT";
    public string? Tags { get; set; }
}
