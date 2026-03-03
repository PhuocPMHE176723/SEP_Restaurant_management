using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SEP_Restaurant_management.Core.Models;

public partial class DiningTable
{
    [Key]
    public int TableId { get; set; }

    [Required]
    [MaxLength(30)]
    public string TableCode { get; set; } = default!;

    public int Capacity { get; set; }

    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = "AVAILABLE";

    public bool IsActive { get; set; } = true;

    public virtual ICollection<Reservation> Reservations { get; set; } = new List<Reservation>();
    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
}
