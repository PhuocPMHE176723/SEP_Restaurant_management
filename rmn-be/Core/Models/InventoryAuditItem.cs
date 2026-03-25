using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SEP_Restaurant_management.Core.Models;

public class InventoryAuditItem
{
    [Key]
    public long AuditItemId { get; set; }

    public long AuditId { get; set; }

    public long IngredientId { get; set; }

    [Column(TypeName = "decimal(18,3)")]
    public decimal SystemQuantity { get; set; } // Tồn kho theo hệ thống

    [Column(TypeName = "decimal(18,3)")]
    public decimal ActualQuantity { get; set; } // Tồn kho thực tế kiểm đếm

    [Column(TypeName = "decimal(18,3)")]
    public decimal Difference { get; set; } // Chênh lệch (Hao tổn)

    [ForeignKey(nameof(AuditId))]
    public virtual InventoryAudit Audit { get; set; } = default!;

    [ForeignKey(nameof(IngredientId))]
    public virtual Ingredient Ingredient { get; set; } = default!;
}
