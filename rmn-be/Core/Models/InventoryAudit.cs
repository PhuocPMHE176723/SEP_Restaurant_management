using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SEP_Restaurant_management.Core.Models;

public class InventoryAudit
{
    [Key]
    public long AuditId { get; set; }

    [Required]
    [MaxLength(30)]
    public string AuditCode { get; set; } = default!;

    public DateTime AuditDate { get; set; }

    public long StaffId { get; set; }

    [MaxLength(255)]
    public string? Note { get; set; }

    [ForeignKey(nameof(StaffId))]
    public virtual Staff Staff { get; set; } = default!;

    public virtual ICollection<InventoryAuditItem> AuditItems { get; set; } = new List<InventoryAuditItem>();
}
