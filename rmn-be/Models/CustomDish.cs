using System;
using System.Collections.Generic;

namespace SEP_Restaurant_management.Models;

public partial class CustomDish
{
    public int CustomDishId { get; set; }

    public string DishName { get; set; } = null!;

    public DateTime? CreatedAt { get; set; }

    public string? Description { get; set; }

    public bool? IsActive { get; set; }

    public decimal? Price { get; set; }

    public int? OrderId { get; set; }

    public virtual ICollection<CustomDishIngredient> CustomDishIngredients { get; set; } = new List<CustomDishIngredient>();

    public virtual Order? Order { get; set; }
}
