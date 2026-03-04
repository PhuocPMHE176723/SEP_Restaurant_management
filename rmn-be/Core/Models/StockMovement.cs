using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SEP_Restaurant_management.Core.Models;

public class StockMovement
{
    [Key]
    public long MovementId { get; set; }

    public long IngredientId { get; set; }

    [Required]
    [MaxLength(20)]
    public string MovementType { get; set; } = default!; // OUT/ADJUST

    public decimal Quantity { get; set; }

    [MaxLength(30)]
    public string? RefType { get; set; } // USAGE/ADJUSTMENT/PURCHASE_RECEIPT

    public long? RefId { get; set; }

    public DateTime MovedAt { get; set; }

    public long? CreatedByStaffId { get; set; }

    [MaxLength(255)]
    public string? Note { get; set; }

    [ForeignKey(nameof(IngredientId))]
    public virtual Ingredient Ingredient { get; set; } = default!;

    [ForeignKey(nameof(CreatedByStaffId))]
    public virtual Staff? CreatedByStaff { get; set; }
}
