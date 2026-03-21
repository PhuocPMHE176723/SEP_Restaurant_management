using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEP_Restaurant_management.Core.Data;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Services.Interface;
using System.Security.Claims;
using SEP_Restaurant_management.Core.Middlewares;

namespace SEP_Restaurant_management.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InvoiceController : BaseController
{
    private readonly SepDatabaseContext _context;
    private readonly IPromotionService _promotionService;

    public InvoiceController(SepDatabaseContext context, IPromotionService promotionService)
    {
        _context = context;
        _promotionService = promotionService;
    }

    [HttpGet("preview/{orderId}")]
    [Authorize(Roles = "Receptionist,Staff,Manager,Admin")]
    public async Task<IActionResult> PreviewInvoice(long orderId)
    {
        var order = await _context.Orders
            .Include(o => o.OrderItems)
            .Include(o => o.Customer)
            .FirstOrDefaultAsync(o => o.OrderId == orderId);

        if (order == null) return NotFoundResponse("Order not found");

        var subtotal = order.OrderItems.Sum(oi => oi.Quantity * oi.UnitPrice);
        var vatRate = 8.0m; // Default VAT 8%
        var vatAmount = Math.Round(subtotal * (vatRate / 100), 2);
        var total = subtotal + vatAmount;

        return Success(new {
            order.OrderId,
            order.OrderCode,
            CustomerName = order.Customer?.FullName,
            CustomerId = order.CustomerId,
            Subtotal = subtotal,
            VatRate = vatRate,
            VatAmount = vatAmount,
            TotalAmount = total,
            Items = order.OrderItems.Select(oi => new {
                MenuItemName = oi.ItemNameSnapshot,
                oi.Quantity,
                oi.UnitPrice,
                Total = oi.Quantity * oi.UnitPrice
            })
        });
    }

    [HttpPost("checkout")]
    [Authorize(Roles = "Receptionist,Staff,Manager,Admin")]
    public async Task<IActionResult> Checkout([FromBody] CheckoutRequest request)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var order = await _context.Orders
                .Include(o => o.OrderItems)
                .Include(o => o.Table)
                .FirstOrDefaultAsync(o => o.OrderId == request.OrderId);

            if (order == null) return NotFoundResponse("Order not found");
            if (order.Status == "CLOSED") return Failure("Order already closed");

            var subtotal = order.OrderItems.Sum(oi => oi.Quantity * oi.UnitPrice);
            decimal discountAmount = 0;

            // 1. Áp dụng mã giảm giá nếu có
            if (!string.IsNullOrEmpty(request.DiscountCode))
            {
                var discount = await _promotionService.ValidateDiscountCodeAsync(request.DiscountCode, subtotal);
                if (discount != null)
                {
                    if (discount.DiscountType == "PERCENTAGE" || discount.DiscountType == "PERCENT")
                    {
                        discountAmount = subtotal * (discount.DiscountValue / 100);
                        if (discount.MaxDiscountAmount.HasValue && discountAmount > discount.MaxDiscountAmount.Value)
                            discountAmount = discount.MaxDiscountAmount.Value;
                    }
                    else // FIXED
                    {
                        discountAmount = discount.DiscountValue;
                    }
                    
                    // Mark discount code as used
                    var dc = await _context.DiscountCodes.FirstOrDefaultAsync(x => x.Code == request.DiscountCode);
                    if (dc != null) dc.UsedCount++;
                }
                else
                {
                    return Failure("Mã giảm giá không hợp lệ hoặc đã hết hạn.");
                }
            }

            // 2. Tính thuế VAT
            var vatAmount = Math.Round((subtotal - discountAmount) * 0.08m, 2);
            var totalAmount = subtotal - discountAmount + vatAmount;

            // 3. Tạo Invoice
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var staff = await _context.Staffs.FirstOrDefaultAsync(s => s.UserId == userId);
            
            var invoiceCode = $"INV-{DateTimeHelper.VietnamNow():yyyyMMdd}-{Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper()}";
            var invoice = new Invoice
            {
                InvoiceCode = invoiceCode,
                OrderId = order.OrderId,
                CustomerId = request.CustomerId ?? order.CustomerId,
                Subtotal = subtotal,
                DiscountAmount = discountAmount,
                VatAmount = vatAmount,
                TotalAmount = totalAmount,
                PaidAmount = totalAmount,
                PaymentStatus = "PAID",
                IssuedAt = DateTimeHelper.VietnamNow(),
                IssuedByStaffId = staff?.StaffId ?? 0,
                Note = request.Note
            };

            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync();

            // 4. Tạo InvoiceLines
            foreach (var item in order.OrderItems)
            {
                var line = new InvoiceLine
                {
                    InvoiceId = invoice.InvoiceId,
                    ItemId = item.ItemId,
                    Description = item.ItemNameSnapshot,
                    Quantity = item.Quantity,
                    UnitPrice = item.UnitPrice,
                    LineTotal = item.Quantity * item.UnitPrice
                };
                _context.InvoiceLines.Add(line);
            }

            // 5. Tạo Payment
            var payment = new Payment
            {
                InvoiceId = invoice.InvoiceId,
                Method = request.PaymentMethod, // CASH/BANK/QR/CARD
                Amount = totalAmount,
                PaidAt = DateTimeHelper.VietnamNow(),
                ReceivedByStaffId = staff?.StaffId,
                Note = "Thanh toán hóa đơn"
            };
            _context.Payments.Add(payment);

            // 6. Cập nhật Order status & Table status
            order.Status = "CLOSED";
            order.ClosedAt = DateTimeHelper.VietnamNow();
            if (order.Table != null)
            {
                order.Table.Status = "AVAILABLE";
            }

            // 7. Tích điểm Loyalty nếu có khách hàng
            var targetCustomerId = request.CustomerId ?? order.CustomerId;
            if (targetCustomerId.HasValue)
            {
                var points = await _promotionService.CalculateLoyaltyPointsAsync(targetCustomerId.Value, totalAmount);
                if (points > 0)
                {
                    await _promotionService.AwardPointsAsync(targetCustomerId.Value, points, "INVOICE", invoice.InvoiceId);
                }
            }

            await _context.SaveChangesAsync();
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
    public long? CustomerId { get; set; }
    public string? DiscountCode { get; set; }
    public string PaymentMethod { get; set; } = "CASH";
    public string? Note { get; set; }
}
