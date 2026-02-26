using System;
using System.Collections.Generic;

namespace SEP_Restaurant_management.Models;

public partial class OrderStaff
{
    public int OrderStaffId { get; set; }

    public int OrderId { get; set; }

    public int StaffId { get; set; }

    public string? Role { get; set; }

    public virtual Order Order { get; set; } = null!;

    public virtual Staff Staff { get; set; } = null!;
}
