using System;
using System.Collections.Generic;

namespace SEP_Restaurant_management.Models;

public partial class Order
{
    public int OrderId { get; set; }

    public int CustomerId { get; set; }

    public decimal? TotalPrice { get; set; }

    public string? OrderStatus { get; set; }

    public DateTime? OrderDate { get; set; }

    public int? ShiftId { get; set; }

    public string? Note { get; set; }

    public string? OrderCode { get; set; }

    public string? Status { get; set; }

    public DateTime? CreatedAt { get; set; }

    public decimal? DiscountPrice { get; set; }

    public string? PaymentMethod { get; set; }

    public string? PaymentStatus { get; set; }

    public DateTime? PaidAt { get; set; }

    public virtual ICollection<CustomDish> CustomDishes { get; set; } = new List<CustomDish>();

    public virtual Customer Customer { get; set; } = null!;

    public virtual ICollection<OrderDetail> OrderDetails { get; set; } = new List<OrderDetail>();

    public virtual ICollection<OrderStaff> OrderStaffs { get; set; } = new List<OrderStaff>();

    public virtual Shift? Shift { get; set; }

    public virtual ICollection<Discount> Discounts { get; set; } = new List<Discount>();

    public virtual ICollection<Table> Tables { get; set; } = new List<Table>();
}
