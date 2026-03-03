using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SEP_Restaurant_management.Core.Models;

public partial class Ingredient
{
    [Key]
    public long IngredientId { get; set; }

    [Required]
    [MaxLength(150)]
    public string IngredientName { get; set; } = default!;

    [Required]
    [MaxLength(20)]
    public string Unit { get; set; } = default!; // kg, g, l, ml, pcs

    public bool IsActive { get; set; } = true;

    public virtual ICollection<PurchaseReceiptItem> PurchaseReceiptItems { get; set; } = new List<PurchaseReceiptItem>();
    public virtual ICollection<StockMovement> StockMovements { get; set; } = new List<StockMovement>();
}
