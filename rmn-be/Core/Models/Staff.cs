using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SEP_Restaurant_management.Core.Models;

public partial class Staff
{
    [Key]
    public long StaffId { get; set; }

    [Required]
    [MaxLength(450)]
    public string UserId { get; set; } = default!;

    [Required]
    [MaxLength(30)]
    public string StaffCode { get; set; } = default!;

    [Required]
    [MaxLength(150)]
    public string FullName { get; set; } = default!;

    [MaxLength(20)]
    public string? Phone { get; set; }

    [MaxLength(150)]
    public string? Email { get; set; }

    [MaxLength(50)]
    public string? Position { get; set; }

    public DateOnly? HireDate { get; set; }

    [Required]
    [MaxLength(20)]
    public string WorkingStatus { get; set; } = "ACTIVE";

    public DateTime CreatedAt { get; set; }

    public DateTime? UpdatedAt { get; set; }

    [ForeignKey(nameof(UserId))]
    public virtual UserIdentity User { get; set; } = default!;

    public virtual ICollection<CustomerPointsLedger> CustomerPointsLedgers { get; set; } = new List<CustomerPointsLedger>();
    public virtual ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
    public virtual ICollection<OrderStatusHistory> OrderStatusHistories { get; set; } = new List<OrderStatusHistory>();
    public virtual ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();
    public virtual ICollection<PurchaseReceipt> PurchaseReceipts { get; set; } = new List<PurchaseReceipt>();
    public virtual ICollection<StockMovement> StockMovements { get; set; } = new List<StockMovement>();
}
