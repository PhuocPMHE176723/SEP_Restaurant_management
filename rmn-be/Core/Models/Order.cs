using System;
using System.Collections.Generic;

namespace SEP_Restaurant_management.Core.Models;

public partial class Order
{
    public int OrderId { get; set; }

    public int CustomerId { get; set; }

    public decimal? TotalPrice { get; set; }

    public string? OrderStatus { get; set; }

    public DateTime? OrderDate { get; set; }

    public int? ShiftId { get; set; }

<<<<<<< Updated upstream
=======
    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "OPEN"; // OPEN/SENT_TO_KITCHEN/SERVED/CANCELLED/CLOSED

    public DateTime OpenedAt { get; set; }

    public DateTime? ClosedAt { get; set; }

    public long? CreatedByStaffId { get; set; }

    [MaxLength(255)]
>>>>>>> Stashed changes
    public string? Note { get; set; }

    public string? OrderCode { get; set; }

    public string? Status { get; set; }

    public DateTime? CreatedAt { get; set; }

<<<<<<< Updated upstream
    public decimal? DiscountPrice { get; set; }
=======
    [ForeignKey(nameof(CreatedByStaffId))]
    public virtual Staff? CreatedByStaff { get; set; }
>>>>>>> Stashed changes

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
