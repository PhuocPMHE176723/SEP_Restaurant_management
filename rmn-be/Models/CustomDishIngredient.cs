using System;
using System.Collections.Generic;

namespace SEP_Restaurant_management.Models;

public partial class CustomDishIngredient
{
    public int CustomDishIngredientId { get; set; }

    public int IngredientId { get; set; }

    public int CustomDishId { get; set; }

    public decimal Quantity { get; set; }

    public string? Unit { get; set; }

    public virtual CustomDish CustomDish { get; set; } = null!;

    public virtual Ingredient Ingredient { get; set; } = null!;
}
