using System;
using System.Collections.Generic;

namespace SEP_Restaurant_management.Models;

public partial class ImportBill
{
    public int ImportBillId { get; set; }

    public int SupplierId { get; set; }

    public int? CreateStaffId { get; set; }

    public DateTime? ImportDate { get; set; }

    public decimal? TotalAmount { get; set; }

    public string? Status { get; set; }

    public string? Note { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual Staff? CreateStaff { get; set; }

    public virtual ICollection<ImportBillDetail> ImportBillDetails { get; set; } = new List<ImportBillDetail>();

    public virtual Supplier Supplier { get; set; } = null!;
}
