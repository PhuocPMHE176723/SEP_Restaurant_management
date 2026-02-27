using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;
using System.ComponentModel.DataAnnotations;

namespace SEP_Restaurant_management.Models;

public partial class Staff
{
    [Key]
    public int StaffId { get; set; }

    [Required]
    public string UserId { get; set; } = default!;

    [ForeignKey(nameof(UserId))]
    public UserIdentity User { get; set; } = default!;

    // ===== Profile fields =====
    [MaxLength(100)]
    public string? Fullname { get; set; }

    [MaxLength(20)]
    public string? PhoneNumber { get; set; }

    [MaxLength(50)]
    public string? StaffCode { get; set; }

    [MaxLength(50)]
    public string? Position { get; set; }

    public bool? Gender { get; set; }

    public DateTime? Dob { get; set; }

    public DateTime? CreatedAt { get; set; }

    public bool IsActive { get; set; } = true;

    public virtual ICollection<ImportBill> ImportBills { get; set; } = new List<ImportBill>();

    public virtual ICollection<OrderStaff> OrderStaffs { get; set; } = new List<OrderStaff>();
}
