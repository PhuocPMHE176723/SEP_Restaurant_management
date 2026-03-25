using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SEP_Restaurant_management.Core.Models;

public class MenuItemIngredient
{
    [Key]
    public long Id { get; set; }

    public long ItemId { get; set; }
    
    public long IngredientId { get; set; }

    [Required]
    [Column(TypeName = "decimal(18,3)")]
    public decimal Quantity { get; set; } // Định mức sử dụng cho 1 đơn vị món ăn

    [ForeignKey(nameof(ItemId))]
    public virtual MenuItem MenuItem { get; set; } = default!;

    [ForeignKey(nameof(IngredientId))]
    public virtual Ingredient Ingredient { get; set; } = default!;
}
