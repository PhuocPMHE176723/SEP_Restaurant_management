using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SEP_Restaurant_management.Core.Models;

public class InvoiceLine
{
    [Key]
    public long InvoiceLineId { get; set; }

    public long InvoiceId { get; set; }

    public long? ItemId { get; set; }

    [Required]
    [MaxLength(200)]
    public string Description { get; set; } = default!;

    public decimal UnitPrice { get; set; }

    public int Quantity { get; set; }

    public decimal DiscountAmount { get; set; } = 0;

    // Computed: (UnitPrice * Quantity) - DiscountAmount
    [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
    public decimal LineTotal { get; set; }

    [ForeignKey(nameof(InvoiceId))]
    public virtual Invoice Invoice { get; set; } = default!;

    [ForeignKey(nameof(ItemId))]
    public virtual MenuItem? MenuItem { get; set; }
}
