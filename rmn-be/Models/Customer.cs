using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace SEP_Restaurant_management.Models;

public partial class Customer
{
    [Key]
    public int CustomerId { get; set; }

    [Required]
    public string UserId { get; set; } = default!;

    [ForeignKey(nameof(UserId))]
    public UserIdentity User { get; set; } = default!;

    // ===== Profile fields =====
    [MaxLength(100)]
    public string? Fullname { get; set; }

    [MaxLength(20)]
    public string? PhoneNumber { get; set; }

    [MaxLength(255)]
    public string? Address { get; set; }

    public bool? Gender { get; set; }   // "Male", "Female", "Other"

    public DateTime? Dob { get; set; }  // DOB

    public DateTime? CreatedAt { get; set; }

    public bool IsActive { get; set; } = true;

    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
}
