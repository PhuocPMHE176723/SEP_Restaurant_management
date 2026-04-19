using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SEP_Restaurant_management.Core.Models;

public class ReservationTable
{
    [Key]
    public long ReservationTableId { get; set; }

    public long ReservationId { get; set; }

    public int TableId { get; set; }

    public DateTime AssignedAt { get; set; }

    [ForeignKey(nameof(ReservationId))]
    public virtual Reservation Reservation { get; set; } = default!;

    [ForeignKey(nameof(TableId))]
    public virtual DiningTable DiningTable { get; set; } = default!;
}
