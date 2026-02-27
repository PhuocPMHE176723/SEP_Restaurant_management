using System;
using System.Collections.Generic;

namespace SEP_Restaurant_management.Models;

public partial class Table
{
    public int TableId { get; set; }

    public string TableName { get; set; } = null!;

    public int? Capacity { get; set; }

    public string? TableType { get; set; }

    public string? Status { get; set; }

    public DateTime? CreatedAt { get; set; }

    public string? Note { get; set; }

    public bool? IsActive { get; set; }

    public string? Position { get; set; }

    public virtual ICollection<Order> Orders { get; set; } = new List<Order>();
}
