using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SEP_Restaurant_management.Core.Models;

public partial class Supplier
{
    [Key]
    public int SupplierId { get; set; }

    [Required]
    [MaxLength(150)]
    public string SupplierName { get; set; } = default!;

    [MaxLength(20)]
    public string? Phone { get; set; }

    [MaxLength(150)]
    public string? Email { get; set; }

    [MaxLength(255)]
    public string? Address { get; set; }

    public bool IsActive { get; set; } = true;

    public virtual ICollection<PurchaseReceipt> PurchaseReceipts { get; set; } = new List<PurchaseReceipt>();
}
