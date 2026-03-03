using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SEP_Restaurant_management.Core.Models;

public class PurchaseReceiptItem
{
    [Key]
    public long ReceiptItemId { get; set; }

    public long ReceiptId { get; set; }

    public long IngredientId { get; set; }

    public decimal Quantity { get; set; }

    public decimal UnitCost { get; set; }

    // Computed: UnitCost * Quantity
    [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
    public decimal LineTotal { get; set; }

    [ForeignKey(nameof(ReceiptId))]
    public virtual PurchaseReceipt Receipt { get; set; } = default!;

    [ForeignKey(nameof(IngredientId))]
    public virtual Ingredient Ingredient { get; set; } = default!;
}
