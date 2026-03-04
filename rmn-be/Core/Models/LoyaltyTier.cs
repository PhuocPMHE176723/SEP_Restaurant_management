using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SEP_Restaurant_management.Core.Models;

public class LoyaltyTier
{
    [Key]
    public int TierId { get; set; }

    [Required]
    [MaxLength(50)]
    public string TierName { get; set; } = default!;

    public int MinPoints { get; set; } = 0;

    public decimal DiscountRate { get; set; } = 0;

    public bool IsActive { get; set; } = true;
}
