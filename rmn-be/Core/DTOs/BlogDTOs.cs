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
    public string? FeaturedImage { get; set; }
    public int CategoryId { get; set; }
    public string CategoryName { get; set; } = default!;
    public string Status { get; set; } = default!;
    public DateTime CreatedAt { get; set; }
}

public class CreateBlogPostDTO
{
    public string Title { get; set; } = default!;
    public string Content { get; set; } = default!;
    public string? FeaturedImage { get; set; }
    public int CategoryId { get; set; }
    public string Status { get; set; } = "DRAFT";
}
