using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SEP_Restaurant_management.Core.Models;

public class DiscountCode
{
    [Key]
    public int DiscountId { get; set; }

    [Required]
    [MaxLength(50)]
    public string Code { get; set; } = default!;

    [Required]
    [MaxLength(20)]
    public string DiscountType { get; set; } = "PERCENT"; // PERCENT or AMOUNT

    [Column(TypeName = "decimal(18,2)")]
    public decimal DiscountValue { get; set; } = 0;

    [Column(TypeName = "decimal(18,2)")]
    public decimal MinOrderValue { get; set; } = 0;

    [Column(TypeName = "decimal(18,2)")]
    public decimal? MaxDiscountAmount { get; set; }

    public int? MaxUses { get; set; }

    public int UsedCount { get; set; } = 0;

    public DateTime? ValidFrom { get; set; }

    public DateTime? ValidTo { get; set; }

    public bool IsActive { get; set; } = true;
}
