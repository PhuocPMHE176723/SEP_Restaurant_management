using System;
using System.Collections.Generic;

namespace SEP_Restaurant_management.Models;

public partial class DishIngredient
{
    public int DishIngredientId { get; set; }

    public int IngredientId { get; set; }

    public int DishId { get; set; }

    public decimal Quantity { get; set; }

    public string? Unit { get; set; }

    public virtual Dish Dish { get; set; } = null!;

    public virtual Ingredient Ingredient { get; set; } = null!;
}
