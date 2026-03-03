using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SEP_Restaurant_management.Core.Models;

public class CustomerPointsLedger
{
    [Key]
    public long LedgerId { get; set; }

    public long CustomerId { get; set; }

    [Required]
    [MaxLength(30)]
    public string RefType { get; set; } = default!; // INVOICE/ADJUSTMENT/REDEEM

    public long? RefId { get; set; }

    public int PointsChange { get; set; }

    [MaxLength(255)]
    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; }

    public long? CreatedByStaffId { get; set; }

    [ForeignKey(nameof(CustomerId))]
    public virtual Customer Customer { get; set; } = default!;

    [ForeignKey(nameof(CreatedByStaffId))]
    public virtual Staff? CreatedByStaff { get; set; }
}
