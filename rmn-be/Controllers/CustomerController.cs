using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEP_Restaurant_management.Core.Data;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Services.Interface;

namespace SEP_Restaurant_management.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CustomerController : BaseController
{
    private readonly SepDatabaseContext _context;
    private readonly IAuthService _authService;
    private readonly UserManager<UserIdentity> _userManager;

    public CustomerController(
        SepDatabaseContext context,
        IAuthService authService,
        UserManager<UserIdentity> userManager
    )
    {
        _context = context;
        _authService = authService;
        _userManager = userManager;
    }

    [HttpGet("lookup")]
    [Authorize(Roles = "Staff,Manager,Admin,Cashier")]
    public async Task<IActionResult> LookupByPhone([FromQuery] string phone)
    {
        var customer = await _context
            .Customers.Include(c => c.Reservations)
            .FirstOrDefaultAsync(c => c.Phone == phone);

        if (customer == null)
            return NotFoundResponse("Customer not found");

        var tiers = await _context
            .LoyaltyTiers.Where(t => t.IsActive)
            .OrderByDescending(t => t.MinPoints)
            .ToListAsync();

        var currentTier =
            tiers.FirstOrDefault(t => customer.TotalPoints >= t.MinPoints)?.TierName
            ?? "Thành viên";

        return Success(
            new
            {
                customer.CustomerId,
                customer.FullName,
                customer.Phone,
                customer.TotalPoints,
                customer.Email,
                CurrentTier = currentTier,
            }
        );
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
            TotalPoints = 0,
        };

        _context.Customers.Add(customer);
        await _context.SaveChangesAsync();

        var tiers = await _context
            .LoyaltyTiers.Where(t => t.IsActive)
            .OrderByDescending(t => t.MinPoints)
            .ToListAsync();

        var currentTier =
            tiers.FirstOrDefault(t => customer.TotalPoints >= t.MinPoints)?.TierName
            ?? "Thành viên";

        return Success(
            new
            {
                customer.CustomerId,
                customer.FullName,
                customer.Phone,
                customer.TotalPoints,
                customer.Email,
                CurrentTier = currentTier,
            },
            "Tạo khách hàng thành công"
        );
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMyProfile()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Failure("Không tìm thấy thông tin đăng nhập");

        var user = await _context.Users.FindAsync(userId);
        var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId == userId);

        if (customer == null)
            return Failure("Tài khoản chưa được liên kết với hồ sơ khách hàng.");
        bool isPhoneVerified = user?.IsPhoneVerified ?? false;

        // Lấy lịch sử tích/trừ điểm
        var ledgers = await _context
            .CustomerPointsLedgers.Where(l => l.CustomerId == customer.CustomerId)
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => new
            {
                l.LedgerId,
                l.RefType,
                l.RefId,
                l.PointsChange,
                l.Note,
                l.CreatedAt,
            })
            .ToListAsync();

        // Lấy lịch sử ưu đãi (các hoá đơn có giảm giá hoặc dùng điểm)
        var discountHistory = await _context
            .Invoices.Where(i => i.CustomerId == customer.CustomerId && (i.DiscountAmount > 0))
            .OrderByDescending(i => i.IssuedAt)
            .Select(i => new
            {
                i.InvoiceId,
                i.InvoiceCode,
                i.TotalAmount,
                i.DiscountAmount,
                i.PaidAmount,
                i.IssuedAt,
            })
            .ToListAsync();

        // Tính hạng thành viên (Nếu có bảng LoyaltyTiers, lấy hạng tương ứng)
        var tiers = await _context
            .LoyaltyTiers.Where(t => t.IsActive)
            .OrderByDescending(t => t.MinPoints)
            .ToListAsync();

        var currentTier =
            tiers.FirstOrDefault(t => customer.TotalPoints >= t.MinPoints)?.TierName
            ?? "Thành viên";

        return Success(
            new
            {
                customer.CustomerId,
                customer.FullName,
                customer.Phone,
                customer.Email,
                customer.TotalPoints,
                IsPhoneVerified = isPhoneVerified,
                CurrentTier = currentTier,
                PointHistory = ledgers,
                DiscountHistory = discountHistory,
            }
        );
    }

    [HttpPut("me")]
    [Authorize]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
            return Failure("Không tìm thấy thông tin đăng nhập");

        var user = await _context.Users.FindAsync(userId);
        var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId == userId);

        if (user == null || customer == null)
            return Failure("Không tìm thấy thông tin người dùng");

        if (!string.IsNullOrEmpty(request.FullName))
        {
            user.FullName = request.FullName;
            customer.FullName = request.FullName;
        }

        if (!string.IsNullOrEmpty(request.Email))
        {
            user.Email = request.Email;
            customer.Email = request.Email;
        }

        if (!string.IsNullOrEmpty(request.Phone))
        {
            if (user.PhoneNumber != request.Phone)
            {
                // Store new phone in pending field, do NOT update PhoneNumber yet
                user.PendingPhoneNumber = request.Phone;
                user.IsPhoneVerified = false;

                // Save pending phone
                await _context.SaveChangesAsync();

                // Send OTP for verification
                var resendRequest = new ResendOtpRequestDTO { PhoneNumber = request.Phone };
                var (succeeded, errors) = await _authService.ResendOtpAsync(resendRequest);

                if (!succeeded)
                {
                    return Failure("Không thể gửi OTP. Vui lòng thử lại.", errors);
                }

                return Success(
                    new { phoneRequiresVerification = true },
                    "Vui lòng xác minh số điện thoại mới qua OTP để hoàn tất cập nhật."
                );
            }
        }

        await _context.SaveChangesAsync();
        return Success(new { }, "Cập nhật hồ sơ thành công");
    }
}

public class UpdateProfileRequest
{
    public string? FullName { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
}

public class CreateCustomerRequest
{
    public string FullName { get; set; } = default!;
    public string Phone { get; set; } = default!;
    public string? Email { get; set; }
}
