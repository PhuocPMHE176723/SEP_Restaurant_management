using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Middlewares;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Services.Interface;

namespace SEP_Restaurant_management.Controllers;

[Route("api/[controller]")]
[Authorize(Roles = "Customer")]
public class ReservationController : BaseController
{
    private readonly IReservationService _reservationService;
    private readonly SepDatabaseContext _context;
    private readonly UserManager<UserIdentity> _userManager;
    private readonly IEmailService _emailService;

    public ReservationController(
        IReservationService reservationService,
        SepDatabaseContext context,
        UserManager<UserIdentity> userManager,
        IEmailService emailService
    )
    {
        _reservationService = reservationService;
        _context = context;
        _userManager = userManager;
        _emailService = emailService;
    }

    private async Task<long> GetCustomerIdAsync()
    {
        // Get UserId from token (sub claim)
        var userId =
            User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? User.FindFirst("sub")?.Value;

        if (string.IsNullOrEmpty(userId))
        {
            throw new UnauthorizedAccessException("User ID not found in token");
        }

        // Query Customer table by UserId
        var customer = await _context.Customers.FirstOrDefaultAsync(c => c.UserId == userId);

        if (customer != null)
        {
            return customer.CustomerId;
        }

        // Auto-provision customer record if missing but user exists
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            throw new UnauthorizedAccessException("Customer record not found for this user");
        }

        var newCustomer = new Customer
        {
            UserId = user.Id,
            FullName = user.FullName ?? user.UserName ?? "Guest",
            Phone = user.PhoneNumber,
            Email = user.Email,
            TotalPoints = 0,
            CreatedAt = DateTimeHelper.VietnamNow(),
        };

        _context.Customers.Add(newCustomer);
        await _context.SaveChangesAsync();

        return newCustomer.CustomerId;
    }

    [HttpPost]
    public async Task<IActionResult> CreateReservation([FromBody] CreateReservationRequest request)
    {
        try
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState
                    .Values.SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                return Failure("Validation failed", errors);
            }

            var customerId = await GetCustomerIdAsync();

            // Validate reservation date is within 7 days
            // Frontend sends local time string (e.g., "2026-03-11T13:45:00")
            // ASP.NET parses it as Unspecified Kind, treat it as local time
            var now = DateTime.Now;
            var today = now.Date; // Chỉ lấy ngày, bỏ giờ phút
            var maxDate = today.AddDays(7); // Ngày tối đa (7 ngày từ hôm nay)

            // Ensure reservedAt is treated as local time
            var reservedDate =
                request.ReservedAt.Kind == DateTimeKind.Unspecified
                    ? DateTime.SpecifyKind(request.ReservedAt, DateTimeKind.Local)
                    : request.ReservedAt.ToLocalTime();
            var reservedDay = reservedDate.Date;

            // Check if reservation time is in the past (with 5 minute grace period)
            if (reservedDate < now.AddMinutes(-5))
            {
                return Failure("Cannot make reservation in the past");
            }

            // Check if reservation is within 7 days (compare dates only)
            if (reservedDay > maxDate)
            {
                return Failure("Can only make reservations up to 7 days in advance");
            }

            var reservation = await _reservationService.CreateReservationAsync(customerId, request);

            // Send Email Notification
            try
            {
                var customer = await _context.Customers.FindAsync(customerId);
                if (customer != null && !string.IsNullOrEmpty(customer.Email))
                {
                    await _emailService.SendReservationReceivedEmailAsync(
                        customer.Email,
                        customer.FullName ?? request.MenuItems.FirstOrDefault()?.Note ?? "Quý khách",
                        reservation.ReservationId,
                        reservation.ReservedAt,
                        reservation.PartySize,
                        reservation.DepositAmount,
                        reservation.Order?.OrderItems ?? new List<OrderItemDTO>()
                    );
                }
            }
            catch (Exception emailEx)
            {
                // Log email error but don't fail the reservation creation
                Console.WriteLine($"[ReservationController] Failed to send booking email: {emailEx.Message}");
            }

            return Success(reservation, "Reservation created successfully");
        }
        catch (UnauthorizedAccessException ex)
        {
            return Failure(ex.Message);
        }
        catch (Exception ex)
        {
            return Failure($"Error: {ex.Message}");
        }
    }

    [HttpGet("my-reservations")]
    public async Task<IActionResult> GetMyReservations()
    {
        try
        {
            var customerId = await GetCustomerIdAsync();
            var reservations = await _reservationService.GetCustomerReservationsAsync(customerId);
            return Success(reservations);
        }
        catch (Exception ex)
        {
            return Failure(ex.Message);
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetReservationById(long id)
    {
        try
        {
            var customerId = await GetCustomerIdAsync();
            var reservation = await _reservationService.GetReservationByIdAsync(id);

            if (reservation == null)
            {
                return NotFoundResponse("Reservation not found");
            }

            // Ensure customer can only view their own reservations
            if (reservation.CustomerId != customerId)
            {
                return Failure("Unauthorized access");
            }

            return Success(reservation);
        }
        catch (Exception ex)
        {
            return Failure(ex.Message);
        }
    }

    [HttpPost("{id}/cancel")]
    public async Task<IActionResult> CancelReservation(long id)
    {
        try
        {
            var customerId = await GetCustomerIdAsync();
            var result = await _reservationService.CancelReservationAsync(id, customerId);

            if (!result)
            {
                return NotFoundResponse("Reservation not found or already cancelled");
            }

            return Success("Reservation cancelled successfully");
        }
        catch (Exception ex)
        {
            return Failure(ex.Message);
        }
    }

    [HttpPut("{id}/items")]
    public async Task<IActionResult> UpdateReservationItems(long id, [FromBody] List<OrderItemRequest> newItems)
    {
        try
        {
            var customerId = await GetCustomerIdAsync();
            var result = await _reservationService.UpdateReservationItemsAsync(id, customerId, newItems ?? new List<OrderItemRequest>());

            if (!result)
            {
                return NotFoundResponse("Reservation not found or status is not PENDING");
            }

            return Success("Reservation items updated successfully");
        }
        catch (Exception ex)
        {
            return Failure(ex.Message);
        }
    }
}
