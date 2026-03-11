using System;

namespace SEP_Restaurant_management.Core.DTOs;

public class SliderDTO
{
    public int SliderId { get; set; }
    public string ImageUrl { get; set; } = default!;
    public string? Title { get; set; }
    public string? Link { get; set; }
    public int DisplayOrder { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreateSliderDTO
{
    public string ImageUrl { get; set; } = default!;
    public string? Title { get; set; }
    public string? Link { get; set; }
    public int DisplayOrder { get; set; }
}
