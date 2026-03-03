using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SEP_Restaurant_management.Core.Models;

public class MenuItemPrice
{
    [Key]
    public long PriceId { get; set; }

    public long ItemId { get; set; }

    public decimal Price { get; set; }

    public DateTime EffectiveFrom { get; set; }

    public DateTime? EffectiveTo { get; set; }

    [ForeignKey(nameof(ItemId))]
    public virtual MenuItem MenuItem { get; set; } = default!;
}
