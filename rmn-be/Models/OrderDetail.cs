using System;
using System.Collections.Generic;

namespace SEP_Restaurant_management.Models;

public partial class OrderDetail
{
    public int OrderDetailId { get; set; }

    public int OrderId { get; set; }

    public int DishSizeId { get; set; }

    public int Quantity { get; set; }

    public DateTime? UpdatedAt { get; set; }

    public string? Note { get; set; }

    public decimal? UnitPrice { get; set; }

    public string? Status { get; set; }

    public virtual DishSize DishSize { get; set; } = null!;

    public virtual Order Order { get; set; } = null!;
}
