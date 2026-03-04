using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SEP_Restaurant_management.Core.Models;

public class MenuItem
{
    [Key]
    public long ItemId { get; set; }

    public int CategoryId { get; set; }

    [Required]
    [MaxLength(150)]
    public string ItemName { get; set; } = default!;

    [MaxLength(500)]
    public string? Description { get; set; }

    public decimal BasePrice { get; set; }

    [MaxLength(500)]
    public string? Thumbnail { get; set; }

    public bool IsActive { get; set; } = true;

    public DateTime CreatedAt { get; set; }

    [ForeignKey(nameof(CategoryId))]
    public virtual MenuCategory Category { get; set; } = default!;

    public virtual ICollection<MenuItemPrice> MenuItemPrices { get; set; } = new List<MenuItemPrice>();
    public virtual ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
    public virtual ICollection<InvoiceLine> InvoiceLines { get; set; } = new List<InvoiceLine>();
}
