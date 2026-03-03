using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SEP_Restaurant_management.Core.Models;

public class Invoice
{
    [Key]
    public long InvoiceId { get; set; }

    [Required]
    [MaxLength(30)]
    public string InvoiceCode { get; set; } = default!;

    public long OrderId { get; set; }

    public long? CustomerId { get; set; }

    public decimal Subtotal { get; set; } = 0;
    public decimal DiscountAmount { get; set; } = 0;
    public decimal VatRate { get; set; } = 8.00m;
    public decimal VatAmount { get; set; } = 0;
    public decimal TotalAmount { get; set; } = 0;
    public decimal PaidAmount { get; set; } = 0;

    [Required]
    [MaxLength(20)]
    public string PaymentStatus { get; set; } = "UNPAID"; // UNPAID/PARTIAL/PAID/REFUNDED

    public DateTime IssuedAt { get; set; }

    public long IssuedByStaffId { get; set; }

    [MaxLength(255)]
    public string? Note { get; set; }

    [ForeignKey(nameof(OrderId))]
    public virtual Order Order { get; set; } = default!;

    [ForeignKey(nameof(CustomerId))]
    public virtual Customer? Customer { get; set; }

    [ForeignKey(nameof(IssuedByStaffId))]
    public virtual Staff IssuedByStaff { get; set; } = default!;

    public virtual ICollection<InvoiceLine> InvoiceLines { get; set; } = new List<InvoiceLine>();
    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
