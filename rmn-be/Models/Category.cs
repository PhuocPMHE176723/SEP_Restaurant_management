using System;
using System.Collections.Generic;

namespace SEP_Restaurant_management.Models;

public partial class Category
{
    public int CategoryId { get; set; }

    public string CategoryName { get; set; } = null!;

    public string? Description { get; set; }

    public DateTime? CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual ICollection<Dish> Dishes { get; set; } = new List<Dish>();
}
