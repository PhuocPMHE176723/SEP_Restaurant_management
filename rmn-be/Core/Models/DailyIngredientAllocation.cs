using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SEP_Restaurant_management.Core.Models;

/// <summary>
/// Quản lý định lượng nguyên liệu chuẩn bị theo từng ngày (Daily Prep/Estimation).
/// Cho phép theo dõi lượng nguyên liệu "đã chuẩn bị" vs "thực tế sử dụng" theo Recipe.
/// </summary>
public class DailyIngredientAllocation
{
    [Key]
    public long Id { get; set; }

    [Required]
    public DateTime Date { get; set; }

    public long IngredientId { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,3)")]
    public decimal AllocatedQuantity { get; set; } // Lượng nguyên liệu bếp chuẩn bị sẵn cho ngày hôm nay

    [Required]
    [Column(TypeName = "decimal(18,3)")]
    public decimal ActuallyUsedQuantity { get; set; } = 0; // Lượng thực tế đã trừ theo Recipe khi SERVED

    [Column(TypeName = "decimal(18,3)")]
    public decimal AdjustedQuantity { get; set; } = 0; // Lượng điều chỉnh (hao hụt, vứt bỏ) cuối ngày

    [MaxLength(255)]
    public string? Note { get; set; }

    [ForeignKey(nameof(IngredientId))]
    public virtual Ingredient Ingredient { get; set; } = default!;
}
