using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEP_Restaurant_management.Core.Data;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Services.Interface;
using System.Security.Claims;
using SEP_Restaurant_management.Core.Middlewares;
using SEP_Restaurant_management.Core.Services.Implementation;

namespace SEP_Restaurant_management.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InvoiceController : BaseController
{
    private readonly SepDatabaseContext _context;
    private readonly IPromotionService _promotionService;
    private readonly InvoiceService _invoiceService;

    public InvoiceController(SepDatabaseContext context, IPromotionService promotionService, InvoiceService invoiceService)
    {
        _context = context;
        _promotionService = promotionService;
        _invoiceService = invoiceService;
    }

    [HttpGet("preview/{orderId}")]
    [Authorize(Roles = "Staff,Manager,Admin,Cashier")]
    public async Task<IActionResult> PreviewInvoice(long orderId, [FromQuery] string? discountCode, [FromQuery] int pointsToUse = 0)
    {
        try
        {
            var preview = await _invoiceService.PreCalculateInvoiceAsync(orderId, discountCode, pointsToUse);
            return Success(preview);
        }
        catch (Exception ex)
        {
            return Failure(ex.Message);
        }
    }

    [HttpPost("checkout")]
    [Authorize(Roles = "Staff,Manager,Admin,Cashier")]
    public async Task<IActionResult> Checkout([FromBody] CheckoutRequest request)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var staff = await _context.Staffs.FirstOrDefaultAsync(s => s.UserId == userId);
            if (staff == null) return Failure("Nhân viên không hợp lệ");

            var invoice = await _invoiceService.ProcessCheckoutAsync(
                request.OrderId, 
                staff.StaffId, 
                request.DiscountCode, 
                request.PointsToUse, 
                request.PaidAmount
            );

            await transaction.CommitAsync();
            return Success(new { invoice.InvoiceId, invoice.InvoiceCode }, "Thanh toán thành công");
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return Failure($"Thanh toán thất bại: {ex.Message}");
        }
    }
}

public class CheckoutRequest
{
    public long OrderId { get; set; }
    public string? DiscountCode { get; set; }
    public int PointsToUse { get; set; }
    public decimal PaidAmount { get; set; }
    public string PaymentMethod { get; set; } = "CASH";
    public string? Note { get; set; }
}
