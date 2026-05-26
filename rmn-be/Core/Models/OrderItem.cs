using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SEP_Restaurant_management.Core.Models;

public class OrderItem
{
    [Key]
    public long OrderItemId { get; set; }

    public long OrderId { get; set; }

    public long ItemId { get; set; }

    [Required]
    [MaxLength(150)]
    public string ItemNameSnapshot { get; set; } = default!;

    public decimal UnitPrice { get; set; }

    public int Quantity { get; set; }

    public decimal DiscountAmount { get; set; } = 0;

    // Computed: (UnitPrice * Quantity) - DiscountAmount  — EF Core will read this as DatabaseGeneratedOption.Computed
    [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
    public decimal LineTotal { get; set; }

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "PENDING"; // PENDING/COOKING/SERVED/CANCELLED/READY_SERVE

    [MaxLength(255)]
    public string? Note { get; set; }

    public DateTime CreatedAt { get; set; }

    [ForeignKey(nameof(OrderId))]
    public virtual Order Order { get; set; } = default!;

    [ForeignKey(nameof(ItemId))]
    public virtual MenuItem MenuItem { get; set; } = default!;
}
