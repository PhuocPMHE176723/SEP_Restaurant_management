using System;
using System.Collections.Generic;

namespace SEP_Restaurant_management.Models;

public partial class Dish
{
    public int DishId { get; set; }

    public int CategoryId { get; set; }

    public string DishName { get; set; } = null!;

    public DateTime? CreatedAt { get; set; }

    public string? Description { get; set; }

    public string? Image { get; set; }

    public bool? IsActive { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Category Category { get; set; } = null!;

    public virtual ICollection<DishIngredient> DishIngredients { get; set; } = new List<DishIngredient>();

    public virtual ICollection<DishSize> DishSizes { get; set; } = new List<DishSize>();
}
