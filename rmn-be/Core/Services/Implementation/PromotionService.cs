using Microsoft.EntityFrameworkCore;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Services.Interface;

namespace SEP_Restaurant_management.Core.Services.Implementation;

public class PromotionService : IPromotionService
{
    private readonly SepDatabaseContext _context;

    public PromotionService(SepDatabaseContext context)
    {
        _context = context;
    }

    // ── System Configs ───────────────────────────────────────────────
    public async Task<List<SystemConfigDTO>> GetAllConfigsAsync()
    {
        return await _context.SystemConfigs
            .Select(c => new SystemConfigDTO
            {
                ConfigKey = c.ConfigKey,
                ConfigValue = c.ConfigValue,
                Description = c.Description,
                UpdatedAt = c.UpdatedAt
            })
            .ToListAsync();
    }

    public async Task<SystemConfigDTO?> GetConfigByKeyAsync(string key)
    {
        var config = await _context.SystemConfigs.FindAsync(key);
        if (config == null) return null;

        return new SystemConfigDTO
        {
            ConfigKey = config.ConfigKey,
            ConfigValue = config.ConfigValue,
            Description = config.Description,
            UpdatedAt = config.UpdatedAt
        };
    }

    public async Task<SystemConfigDTO> UpdateConfigAsync(UpdateSystemConfigDTO request)
    {
        var config = await _context.SystemConfigs.FindAsync(request.ConfigKey);
        if (config == null)
            throw new Exception($"Không tìm thấy cấu hình với mã {request.ConfigKey}");

        config.ConfigKey = request.ConfigKey;
        config.ConfigValue = request.ConfigValue;
        config.UpdatedAt = SEP_Restaurant_management.Core.Middlewares.DateTimeHelper.VietnamNow();

        await _context.SaveChangesAsync();

        return new SystemConfigDTO
        {
            ConfigKey = config.ConfigKey,
            ConfigValue = config.ConfigValue,
            Description = config.Description,
            UpdatedAt = config.UpdatedAt
        };
    }

    public async Task<List<SystemConfigDTO>> UpdateMultipleConfigsAsync(List<UpdateSystemConfigDTO> requests)
    {
        var keys = requests.Select(r => r.ConfigKey).ToList();
        var configs = await _context.SystemConfigs.Where(c => keys.Contains(c.ConfigKey)).ToListAsync();

        foreach (var req in requests)
        {
            var config = configs.FirstOrDefault(c => c.ConfigKey == req.ConfigKey);
            if (config != null)
            {
                config.ConfigValue = req.ConfigValue;
                config.UpdatedAt = SEP_Restaurant_management.Core.Middlewares.DateTimeHelper.VietnamNow();
            }
        }

        await _context.SaveChangesAsync();
        return await GetAllConfigsAsync();
    }

    // ── Discount Codes ───────────────────────────────────────────────
    public async Task<List<DiscountCodeDTO>> GetAllDiscountCodesAsync(bool? isActive = null)
    {
        var query = _context.DiscountCodes.AsQueryable();
        if (isActive.HasValue)
        {
            query = query.Where(d => d.IsActive == isActive.Value);
        }

        return await query
            .OrderByDescending(d => d.DiscountId)
            .Select(d => new DiscountCodeDTO
            {
                DiscountId = d.DiscountId,
                Code = d.Code,
                DiscountType = d.DiscountType,
                DiscountValue = d.DiscountValue,
                MinOrderValue = d.MinOrderValue,
                MaxDiscountAmount = d.MaxDiscountAmount,
                MaxUses = d.MaxUses,
                UsedCount = d.UsedCount,
                ValidFrom = d.ValidFrom,
                ValidTo = d.ValidTo,
                IsActive = d.IsActive
            })
            .ToListAsync();
    }

    public async Task<DiscountCodeDTO?> GetDiscountCodeAsync(int id)
    {
        var d = await _context.DiscountCodes.FindAsync(id);
        if (d == null) return null;

        return new DiscountCodeDTO
        {
            DiscountId = d.DiscountId,
            Code = d.Code,
            DiscountType = d.DiscountType,
            DiscountValue = d.DiscountValue,
            MinOrderValue = d.MinOrderValue,
            MaxDiscountAmount = d.MaxDiscountAmount,
            MaxUses = d.MaxUses,
            UsedCount = d.UsedCount,
            ValidFrom = d.ValidFrom,
            ValidTo = d.ValidTo,
            IsActive = d.IsActive
        };
    }

    public async Task<DiscountCodeDTO?> GetDiscountCodeByCodeAsync(string code)
    {
        var d = await _context.DiscountCodes.FirstOrDefaultAsync(x => x.Code.ToUpper() == code.ToUpper());
        if (d == null) return null;

        return new DiscountCodeDTO
        {
            DiscountId = d.DiscountId,
            Code = d.Code,
            DiscountType = d.DiscountType,
            DiscountValue = d.DiscountValue,
            MinOrderValue = d.MinOrderValue,
            MaxDiscountAmount = d.MaxDiscountAmount,
            MaxUses = d.MaxUses,
            UsedCount = d.UsedCount,
            ValidFrom = d.ValidFrom,
            ValidTo = d.ValidTo,
            IsActive = d.IsActive
        };
    }

    public async Task<DiscountCodeDTO?> CreateDiscountCodeAsync(CreateDiscountCodeDTO request)
    {
        if (await _context.DiscountCodes.AnyAsync(c => c.Code.ToUpper() == request.Code.ToUpper()))
            throw new Exception("Mã giảm giá này đã tồn tại.");

        var discount = new DiscountCode
        {
            Code = request.Code.ToUpper(),
            DiscountType = request.DiscountType,
            DiscountValue = request.DiscountValue,
            MinOrderValue = request.MinOrderValue,
            MaxDiscountAmount = request.MaxDiscountAmount,
            MaxUses = request.MaxUses,
            UsedCount = 0,
            ValidFrom = request.ValidFrom,
            ValidTo = request.ValidTo,
            IsActive = request.IsActive
        };

        _context.DiscountCodes.Add(discount);
        await _context.SaveChangesAsync();

        return await GetDiscountCodeAsync(discount.DiscountId);
    }

    public async Task<DiscountCodeDTO?> UpdateDiscountCodeAsync(int id, UpdateDiscountCodeDTO request)
    {
        var discount = await _context.DiscountCodes.FindAsync(id);
        if (discount == null) throw new Exception("Không tìm thấy mã giảm giá.");

        // Check unique code if changed
        if (discount.Code.ToUpper() != request.Code.ToUpper() &&
            await _context.DiscountCodes.AnyAsync(c => c.Code.ToUpper() == request.Code.ToUpper()))
        {
            throw new Exception("Mã giảm giá này đã tồn tại.");
        }

        discount.Code = request.Code.ToUpper();
        discount.DiscountType = request.DiscountType;
        discount.DiscountValue = request.DiscountValue;
        discount.MinOrderValue = request.MinOrderValue;
        discount.MaxDiscountAmount = request.MaxDiscountAmount;
        discount.MaxUses = request.MaxUses;
        discount.ValidFrom = request.ValidFrom;
        discount.ValidTo = request.ValidTo;
        discount.IsActive = request.IsActive;

        await _context.SaveChangesAsync();
        return await GetDiscountCodeAsync(id);
    }

    public async Task DeleteDiscountCodeAsync(int id)
    {
        var discount = await _context.DiscountCodes.FindAsync(id);
        if (discount != null)
        {
            _context.DiscountCodes.Remove(discount);
            await _context.SaveChangesAsync();
        }
    }

    public async Task<DiscountCodeDTO?> ToggleDiscountCodeAsync(int id)
    {
        var discount = await _context.DiscountCodes.FindAsync(id);
        if (discount == null) throw new Exception("Không tìm thấy mã giảm giá.");

        discount.IsActive = !discount.IsActive;
        await _context.SaveChangesAsync();

        return await GetDiscountCodeAsync(id);
    }

    // ── Loyalty Tiers ───────────────────────────────────────────────
    public async Task<List<LoyaltyTierDTO>> GetAllLoyaltyTiersAsync()
    {
        return await _context.LoyaltyTiers
            .OrderBy(t => t.MinPoints)
            .Select(t => new LoyaltyTierDTO
            {
                TierId = t.TierId,
                TierName = t.TierName,
                MinPoints = t.MinPoints,
                DiscountRate = t.DiscountRate,
                IsActive = t.IsActive
            })
            .ToListAsync();
    }

    public async Task<LoyaltyTierDTO> UpdateLoyaltyTierAsync(int id, UpdateLoyaltyTierDTO request)
    {
        var tier = await _context.LoyaltyTiers.FindAsync(id);
        if (tier == null) throw new Exception("Không tìm thấy hạng thành viên.");

        tier.TierName = request.TierName;
        tier.MinPoints = request.MinPoints;
        tier.DiscountRate = request.DiscountRate;
        tier.IsActive = request.IsActive;

        await _context.SaveChangesAsync();

        return new LoyaltyTierDTO
        {
            TierId = tier.TierId,
            TierName = tier.TierName,
            MinPoints = tier.MinPoints,
            DiscountRate = tier.DiscountRate,
            IsActive = tier.IsActive
        };
    }

    // ── Loyalty Ledgers ─────────────────────────────────────────────
    public async Task<List<LoyaltyLedgerDTO>> GetLoyaltyLedgersAsync(long? customerId = null)
    {
        var query = _context.CustomerPointsLedgers
            .Include(l => l.Customer)
            .Include(l => l.CreatedByStaff)
            .AsQueryable();

        if (customerId.HasValue)
        {
            query = query.Where(l => l.CustomerId == customerId.Value);
        }

        return await query
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => new LoyaltyLedgerDTO
            {
                LedgerId = l.LedgerId,
                CustomerId = l.CustomerId,
                CustomerName = l.Customer != null ? (l.Customer.FullName ?? "N/A") : "N/A",
                CustomerPhone = l.Customer != null ? (l.Customer.Phone ?? "N/A") : "N/A",
                RefType = l.RefType,
                RefId = l.RefId,
                PointsChange = l.PointsChange,
                Note = l.Note,
                CreatedAt = l.CreatedAt,
                CreatedByStaffName = l.CreatedByStaff != null ? l.CreatedByStaff.FullName : null
            })
            .ToListAsync();
    }

    // ── Checkout Helpers ─────────────────────────────────────────────
    public async Task<DiscountCodeDTO?> ValidateDiscountCodeAsync(string code, decimal orderValue)
    {
        var d = await _context.DiscountCodes
            .FirstOrDefaultAsync(x => x.Code == code && x.IsActive);

        if (d == null) return null;

        var now = SEP_Restaurant_management.Core.Middlewares.DateTimeHelper.VietnamNow();
        if (now < d.ValidFrom || now > d.ValidTo) return null;
        if (d.MaxUses.HasValue && d.UsedCount >= d.MaxUses.Value) return null;
        if (orderValue < d.MinOrderValue) return null;

        return await GetDiscountCodeAsync(d.DiscountId);
    }

    public async Task<int> CalculateLoyaltyPointsAsync(long customerId, decimal amount)
    {
        // Giả sử 1% tổng tiền thành điểm. Thực tế nên lấy từ SystemConfig
        var config = await GetConfigByKeyAsync("LOYALTY_POINT_RATE");
        decimal rate = 0.01m; // Default 1%
        if (config != null && decimal.TryParse(config.ConfigValue, out var parsedRate))
        {
            rate = parsedRate / 100;
        }

        return (int)Math.Floor(amount * rate);
    }

    public async Task AwardPointsAsync(long customerId, int points, string refType, long refId)
    {
        var customer = await _context.Customers.FindAsync(customerId);
        if (customer == null) return;

        customer.TotalPoints += points;

        var ledger = new CustomerPointsLedger
        {
            CustomerId = customerId,
            PointsChange = points,
            RefType = refType,
            RefId = refId,
            Note = $"Tích điểm từ đơn hàng #{refId}",
            CreatedAt = SEP_Restaurant_management.Core.Middlewares.DateTimeHelper.VietnamNow()
        };

        _context.CustomerPointsLedgers.Add(ledger);
        await _context.SaveChangesAsync();
    }
}
