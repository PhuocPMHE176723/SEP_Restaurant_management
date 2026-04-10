using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Services.Interface;

namespace SEP_Restaurant_management.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PromotionController : ControllerBase
{
    private readonly IPromotionService _promotionService;

    public PromotionController(IPromotionService promotionService)
    {
        _promotionService = promotionService;
    }

    // ── System Configs ───────────────────────────────────────────
    [HttpGet("configs")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<List<SystemConfigDTO>>> GetAllConfigs()
    {
        var configs = await _promotionService.GetAllConfigsAsync();
        return Ok(configs);
    }

    [HttpGet("configs/{key}")]
    [Authorize(Roles = "Admin,Manager,Staff,Cashier")]
    public async Task<ActionResult<SystemConfigDTO>> GetConfigByKey(string key)
    {
        var config = await _promotionService.GetConfigByKeyAsync(key);
        if (config == null) return NotFound(new { message = $"Không tìm thấy cấu hình: {key}" });
        return Ok(config);
    }

    [HttpPut("configs")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<ActionResult<List<SystemConfigDTO>>> UpdateMultipleConfigs([FromBody] List<UpdateSystemConfigDTO> requests)
    {
        try
        {
            if (requests == null || !requests.Any()) return BadRequest(new { message = "Danh sách cập nhật rỗng." });
            var result = await _promotionService.UpdateMultipleConfigsAsync(requests);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // ── Discount Codes ───────────────────────────────────────────
    [HttpGet("discounts")]
    [Authorize(Roles = "Admin,Manager,Staff,Cashier")]
    public async Task<ActionResult<List<DiscountCodeDTO>>> GetAllDiscountCodes([FromQuery] bool? isActive)
    {
        var discounts = await _promotionService.GetAllDiscountCodesAsync(isActive);
        return Ok(discounts);
    }

    [HttpGet("discounts/validate")]
    [Authorize(Roles = "Admin,Manager,Staff,Cashier")]
    public async Task<ActionResult<DiscountCodeDTO>> ValidateDiscountCode([FromQuery] string code, [FromQuery] decimal orderValue)
    {
        var result = await _promotionService.ValidateDiscountCodeAsync(code, orderValue);
        if (result == null) return BadRequest(new { message = "Mã giảm giá không hợp lệ hoặc không đủ điều kiện." });
        return Ok(result);
    }

    [HttpGet("discounts/{id}")]
    [Authorize(Roles = "Admin,Manager,Staff,Cashier")]
    public async Task<ActionResult<DiscountCodeDTO>> GetDiscountCode(int id)
    {
        var discount = await _promotionService.GetDiscountCodeAsync(id);
        if (discount == null) return NotFound(new { message = "Không tìm thấy mã giảm giá" });
        return Ok(discount);
    }

    [HttpPost("discounts")]
    public async Task<ActionResult<DiscountCodeDTO>> CreateDiscountCode([FromBody] CreateDiscountCodeDTO request)
    {
        try
        {
            var result = await _promotionService.CreateDiscountCodeAsync(request);
            if (result == null) return BadRequest(new { message = "Lỗi khi tạo mã giảm giá" });
            return CreatedAtAction(nameof(GetDiscountCode), new { id = result.DiscountId }, result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("discounts/{id}")]
    public async Task<ActionResult<DiscountCodeDTO>> UpdateDiscountCode(int id, [FromBody] UpdateDiscountCodeDTO request)
    {
        try
        {
            var result = await _promotionService.UpdateDiscountCodeAsync(id, request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("discounts/{id}")]
    public async Task<IActionResult> DeleteDiscountCode(int id)
    {
        await _promotionService.DeleteDiscountCodeAsync(id);
        return NoContent();
    }

    [HttpPatch("discounts/{id}/toggle")]
    public async Task<ActionResult<DiscountCodeDTO>> ToggleDiscountCode(int id)
    {
        try
        {
            var result = await _promotionService.ToggleDiscountCodeAsync(id);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // ── Loyalty Tiers ─────────────────────────────────────────────
    [HttpGet("loyalty/tiers")]
    public async Task<ActionResult<List<LoyaltyTierDTO>>> GetAllLoyaltyTiers()
    {
        var tiers = await _promotionService.GetAllLoyaltyTiersAsync();
        return Ok(tiers);
    }

    [HttpPut("loyalty/tiers/{id}")]
    public async Task<ActionResult<LoyaltyTierDTO>> UpdateLoyaltyTier(int id, [FromBody] UpdateLoyaltyTierDTO request)
    {
        try
        {
            var result = await _promotionService.UpdateLoyaltyTierAsync(id, request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    // ── Loyalty Ledgers ───────────────────────────────────────────
    [HttpGet("loyalty/ledgers")]
    public async Task<ActionResult<List<LoyaltyLedgerDTO>>> GetLoyaltyLedgers([FromQuery] long? customerId)
    {
        var ledgers = await _promotionService.GetLoyaltyLedgersAsync(customerId);
        return Ok(ledgers);
    }
}
