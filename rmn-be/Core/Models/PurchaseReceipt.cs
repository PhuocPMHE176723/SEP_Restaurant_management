using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SEP_Restaurant_management.Core.Models;

public class PurchaseReceipt
{
    [Key]
    public long ReceiptId { get; set; }

    [Required]
    [MaxLength(30)]
    public string ReceiptCode { get; set; } = default!;

    public int? SupplierId { get; set; }

    public DateTime ReceiptDate { get; set; }

    public decimal TotalAmount { get; set; } = 0;

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "RECEIVED"; // DRAFT/RECEIVED/CANCELLED

    public long CreatedByStaffId { get; set; }

    [MaxLength(255)]
    public string? Note { get; set; }

    [ForeignKey(nameof(SupplierId))]
    public virtual Supplier? Supplier { get; set; }

    [ForeignKey(nameof(CreatedByStaffId))]
    public virtual Staff CreatedByStaff { get; set; } = default!;

    public virtual ICollection<PurchaseReceiptItem> Items { get; set; } = new List<PurchaseReceiptItem>();
}
