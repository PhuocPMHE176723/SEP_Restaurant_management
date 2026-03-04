using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SEP_Restaurant_management.Core.Models;

public class OrderStatusHistory
{
    [Key]
    public long HistoryId { get; set; }

    public long OrderId { get; set; }

    [MaxLength(20)]
    public string? OldStatus { get; set; }

    [Required]
    [MaxLength(20)]
    public string NewStatus { get; set; } = default!;

    public DateTime ChangedAt { get; set; }

    public long? ChangedByStaffId { get; set; }

    [MaxLength(255)]
    public string? Note { get; set; }

    [ForeignKey(nameof(OrderId))]
    public virtual Order Order { get; set; } = default!;

    [ForeignKey(nameof(ChangedByStaffId))]
    public virtual Staff? ChangedByStaff { get; set; }
}
