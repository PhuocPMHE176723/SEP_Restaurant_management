using System;
using System.Collections.Generic;

namespace SEP_Restaurant_management.Models;

public partial class DishSize
{
    public int DishSizeId { get; set; }

    public int DishId { get; set; }

    public int PriceId { get; set; }

    public string DishSizeName { get; set; } = null!;

    public DateTime? CreatedAt { get; set; }

    public bool? IsActive { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public virtual Dish Dish { get; set; } = null!;

    public virtual ICollection<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>();

    public virtual Price Price { get; set; } = null!;
}
