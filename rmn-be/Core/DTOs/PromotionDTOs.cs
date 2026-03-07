using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SEP_Restaurant_management.Core.DTOs;

// ── System Config DTOs ─────────────────────────────────────────

public class SystemConfigDTO
{
    public string ConfigKey { get; set; } = default!;
    public string ConfigValue { get; set; } = default!;
    public string? Description { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public class UpdateSystemConfigDTO
{
    [Required]
    public string ConfigKey { get; set; } = default!;
    [Required]
    public string ConfigValue { get; set; } = default!;
}

// ── Discount Code DTOs ─────────────────────────────────────────

public class DiscountCodeDTO
{
    public int DiscountId { get; set; }
    public string Code { get; set; } = default!;
    public string DiscountType { get; set; } = default!;
    public decimal DiscountValue { get; set; }
    public decimal MinOrderValue { get; set; }
    public decimal? MaxDiscountAmount { get; set; }
    public int? MaxUses { get; set; }
    public int UsedCount { get; set; }
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }
    public bool IsActive { get; set; }
}

public class CreateDiscountCodeDTO
{
    [Required(ErrorMessage = "Mã giảm giá là bắt buộc")]
    [MaxLength(50)]
    public string Code { get; set; } = default!;

    [Required]
    public string DiscountType { get; set; } = "PERCENT";

    [Range(0.01, double.MaxValue, ErrorMessage = "Giá trị giảm tối thiểu là 0.01")]
    public decimal DiscountValue { get; set; }

    public decimal MinOrderValue { get; set; } = 0;
    public decimal? MaxDiscountAmount { get; set; }
    public int? MaxUses { get; set; }
    public DateTime? ValidFrom { get; set; }
    public DateTime? ValidTo { get; set; }
    public bool IsActive { get; set; } = true;
}

public class UpdateDiscountCodeDTO : CreateDiscountCodeDTO { }

// ── Loyalty Transaction DTOs ───────────────────────────────────

public class LoyaltyLedgerDTO
{
    public long LedgerId { get; set; }
    public long CustomerId { get; set; }
    public string CustomerName { get; set; } = default!;
    public string CustomerPhone { get; set; } = default!;
    public string RefType { get; set; } = default!;
    public long? RefId { get; set; }
    public int PointsChange { get; set; }
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CreatedByStaffName { get; set; }
}

public class LoyaltyTierDTO
{
    public int TierId { get; set; }
    public string TierName { get; set; } = default!;
    public int MinPoints { get; set; }
    public decimal DiscountRate { get; set; }
    public bool IsActive { get; set; }
}

public class UpdateLoyaltyTierDTO
{
    [Required]
    [MaxLength(50)]
    public string TierName { get; set; } = default!;
    public int MinPoints { get; set; }
    public decimal DiscountRate { get; set; }
    public bool IsActive { get; set; }
}
