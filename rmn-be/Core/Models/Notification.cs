using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SEP_Restaurant_management.Core.Models;

public class Notification
{
    [Key]
    public long NotificationId { get; set; }

    [MaxLength(450)]
    public string? UserId { get; set; }

    [MaxLength(50)]
    public string? Role { get; set; }

    [Required]
    [MaxLength(150)]
    public string Title { get; set; } = string.Empty;

    [Required]
    [MaxLength(500)]
    public string Message { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string Type { get; set; } = "SYSTEM"; // CHECKIN, PAYMENT, RESERVATION, CLEANUP, SYSTEM

    public bool IsRead { get; set; } = false;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [MaxLength(100)]
    public string? RelatedId { get; set; }

    [ForeignKey("UserId")]
    public virtual UserIdentity? User { get; set; }
}
