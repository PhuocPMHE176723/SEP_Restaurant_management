using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SEP_Restaurant_management.Core.Models;

public partial class Customer
{
    [Key]
    public long CustomerId { get; set; }

    [MaxLength(450)]
    public string? UserId { get; set; }

    [MaxLength(150)]
    public string? FullName { get; set; }

    [MaxLength(20)]
    public string? Phone { get; set; }

    [MaxLength(150)]
    public string? Email { get; set; }

    public int TotalPoints { get; set; } = 0;

    public DateTime CreatedAt { get; set; }

    [ForeignKey(nameof(UserId))]
    public virtual UserIdentity? User { get; set; }

    public virtual ICollection<CustomerPointsLedger> PointsLedgers { get; set; } = new List<CustomerPointsLedger>();
    public virtual ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
    public virtual ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
}
