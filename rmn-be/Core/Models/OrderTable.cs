using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SEP_Restaurant_management.Core.Models;

public class OrderTable
{
    [Key]
    public long OrderTableId { get; set; }

    public long OrderId { get; set; }

    public int TableId { get; set; }

    public DateTime AssignedAt { get; set; }

    [ForeignKey(nameof(OrderId))]
    public virtual Order Order { get; set; } = default!;

    [ForeignKey(nameof(TableId))]
    public virtual DiningTable DiningTable { get; set; } = default!;
}
