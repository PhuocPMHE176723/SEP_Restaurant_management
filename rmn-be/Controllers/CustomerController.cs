using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEP_Restaurant_management.Core.Data;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.DTOs;
using System.Security.Claims;

namespace SEP_Restaurant_management.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CustomerController : BaseController
{
    private readonly SepDatabaseContext _context;

    public CustomerController(SepDatabaseContext context)
    {
        _context = context;
    }

    [HttpGet("lookup")]
    [Authorize(Roles = "Staff,Manager,Admin,Cashier")]
    public async Task<IActionResult> LookupByPhone([FromQuery] string phone)
    {
        var customer = await _context.Customers
            .Include(c => c.Reservations)
            .FirstOrDefaultAsync(c => c.Phone == phone);

        if (customer == null) return NotFoundResponse("Customer not found");

        return Success(new {
            customer.CustomerId,
            customer.FullName,
            customer.Phone,
            customer.TotalPoints,
            customer.Email
        });
    }

    [HttpPost]
    [Authorize(Roles = "Staff,Manager,Admin,Cashier")]
    public async Task<IActionResult> CreateCustomer([FromBody] CreateCustomerRequest request)
    {
        if (await _context.Customers.AnyAsync(c => c.Phone == request.Phone))
            return Failure("Số điện thoại này đã được đăng ký.");

        var customer = new Customer
        {
            FullName = request.FullName,
            Phone = request.Phone,
            Email = request.Email,
            CreatedAt = DateTime.UtcNow,
            TotalPoints = 0
        };

        _context.Customers.Add(customer);
        await _context.SaveChangesAsync();

        return Success(customer, "Tạo khách hàng thành công");
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMyProfile()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId)) return Failure("Không tìm thấy thông tin đăng nhập");

        var customer = await _context.Customers
            .FirstOrDefaultAsync(c => c.UserId == userId);

        if (customer == null) return Failure("Tài khoản chưa được liên kết với hồ sơ khách hàng.");

        // Lấy lịch sử tích/trừ điểm
        var ledgers = await _context.CustomerPointsLedgers
            .Where(l => l.CustomerId == customer.CustomerId)
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => new {
                l.LedgerId,
                l.RefType,
                l.RefId,
                l.PointsChange,
                l.Note,
                l.CreatedAt
            })
            .ToListAsync();

        // Lấy lịch sử ưu đãi (các hoá đơn có giảm giá hoặc dùng điểm)
        var discountHistory = await _context.Invoices
            .Where(i => i.CustomerId == customer.CustomerId && (i.DiscountAmount > 0))
            .OrderByDescending(i => i.IssuedAt)
            .Select(i => new {
                i.InvoiceId,
                i.InvoiceCode,
                i.TotalAmount,
                i.DiscountAmount,
                i.PaidAmount,
                i.IssuedAt
            })
            .ToListAsync();

        // Tính hạng thành viên (Nếu có bảng LoyaltyTiers, lấy hạng tương ứng)
        var tiers = await _context.LoyaltyTiers
            .Where(t => t.IsActive)
            .OrderByDescending(t => t.MinPoints).ToListAsync();
            
        var currentTier = tiers.FirstOrDefault(t => customer.TotalPoints >= t.MinPoints)?.TierName ?? "Thành viên";

        return Success(new {
            customer.CustomerId,
            customer.FullName,
            customer.Phone,
            customer.Email,
            customer.TotalPoints,
            CurrentTier = currentTier,
            PointHistory = ledgers,
            DiscountHistory = discountHistory
        });
    }
}

public class CreateCustomerRequest
{
    public string FullName { get; set; } = default!;
    public string Phone { get; set; } = default!;
    public string? Email { get; set; }
}
