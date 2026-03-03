using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SEP_Restaurant_management.Core.Models;

public class Payment
{
    [Key]
    public long PaymentId { get; set; }

    public long InvoiceId { get; set; }

    [Required]
    [MaxLength(20)]
    public string Method { get; set; } = default!; // CASH/BANK/QR/CARD

    public decimal Amount { get; set; }

    public DateTime PaidAt { get; set; }

    [MaxLength(100)]
    public string? ReferenceNo { get; set; }

    public long? ReceivedByStaffId { get; set; }

    [MaxLength(255)]
    public string? Note { get; set; }

    [ForeignKey(nameof(InvoiceId))]
    public virtual Invoice Invoice { get; set; } = default!;

    [ForeignKey(nameof(ReceivedByStaffId))]
    public virtual Staff? ReceivedByStaff { get; set; }
}
