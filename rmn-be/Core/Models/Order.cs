using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SEP_Restaurant_management.Core.Models;

public class Order
{
    [Key]
    public long OrderId { get; set; }

    [Required]
    [MaxLength(30)]
    public string OrderCode { get; set; } = default!;

    public int? TableId { get; set; }

    public long? ReservationId { get; set; }

    public long? CustomerId { get; set; }

    [Required]
    [MaxLength(20)]
    public string OrderType { get; set; } = "DINE_IN"; // DINE_IN/TAKEAWAY

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "OPEN"; // OPEN/SENT_TO_KITCHEN/SERVED/CANCELLED/CLOSED

    public DateTime OpenedAt { get; set; }

    public DateTime? ClosedAt { get; set; }

    public long CreatedByStaffId { get; set; }

    [MaxLength(255)]
    public string? Note { get; set; }

    [ForeignKey(nameof(TableId))]
    public virtual DiningTable? Table { get; set; }

    [ForeignKey(nameof(ReservationId))]
    public virtual Reservation? Reservation { get; set; }

    [ForeignKey(nameof(CustomerId))]
    public virtual Customer? Customer { get; set; }

    [ForeignKey(nameof(CreatedByStaffId))]
    public virtual Staff CreatedByStaff { get; set; } = default!;

    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    public virtual ICollection<OrderStatusHistory> StatusHistories { get; set; } = new List<OrderStatusHistory>();
    public virtual Invoice? Invoice { get; set; }
}
