using System;
using System.ComponentModel.DataAnnotations;

namespace SEP_Restaurant_management.Core.Models;

public class SystemConfig
{
    [Key]
    [MaxLength(100)]
    public string ConfigKey { get; set; } = default!;

    [Required]
    [MaxLength(500)]
    public string ConfigValue { get; set; } = default!;

    [MaxLength(500)]
    public string? Description { get; set; }

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
