using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SEP_Restaurant_management.Core.Models;

public class Reservation
{
    [Key]
    public long ReservationId { get; set; }

    public long? CustomerId { get; set; }

    public int? TableId { get; set; }

    [Required]
    [MaxLength(150)]
    public string CustomerName { get; set; } = default!;

    [Required]
    [MaxLength(20)]
    public string CustomerPhone { get; set; } = default!;

    public int PartySize { get; set; }

    public DateTime ReservedAt { get; set; }

    public int DurationMinutes { get; set; } = 90;

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "PENDING"; // PENDING/CONFIRMED/CANCELLED/NO_SHOW/COMPLETED

    [MaxLength(255)]
    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; }

    public long? CreatedByStaffId { get; set; }

    [ForeignKey(nameof(CustomerId))]
    public virtual Customer? Customer { get; set; }

    [ForeignKey(nameof(TableId))]
    public virtual DiningTable? Table { get; set; }

    [ForeignKey(nameof(CreatedByStaffId))]
    public virtual Staff? CreatedByStaff { get; set; }

    public virtual Order? Order { get; set; }
    
    public decimal DepositAmount { get; set; }
    
    public bool IsDepositPaid { get; set; } = false;
    
    public DateTime? DepositPaidAt { get; set; }
}
