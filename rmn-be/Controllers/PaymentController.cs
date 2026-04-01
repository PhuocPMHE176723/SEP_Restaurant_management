using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Services.Interface;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using SEP_Restaurant_management.Core.DTOs;
using AutoMapper;
using System.Globalization;

namespace SEP_Restaurant_management.Controllers;

[Route("api/[controller]")]
[ApiController]
public class PaymentController : ControllerBase
{
    private readonly IConfiguration _configuration;
    private readonly SepDatabaseContext _context;
    private readonly IEmailService _emailService;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IMapper _mapper;
 
    public PaymentController(
        IConfiguration configuration,
        SepDatabaseContext context,
        IEmailService emailService,
        IHttpClientFactory httpClientFactory,
        IMapper mapper)
    {
        _configuration = configuration;
        _context = context;
        _emailService = emailService;
        _httpClientFactory = httpClientFactory;
        _mapper = mapper;
    }

    [HttpGet("sepay-config")]
    public IActionResult GetSepayConfig()
    {
        var acc = _configuration["SePay:AccountCheck"] ?? _configuration["SePay:Account"] ?? string.Empty;
        var bank = _configuration["SePay:Bank"] ?? string.Empty;
        return Ok(new { account = acc, bank = bank });
    }

    [HttpGet("sepay/check-transaction")]
    public async Task<IActionResult> CheckSepayTransaction([FromQuery] long reservationId, [FromQuery] string? paymentCode = null)
    {
        try
        {
            var apiKey = _configuration["SePay:ApiKey"];
            if (string.IsNullOrEmpty(apiKey))
                return StatusCode(500, new { success = false, message = "Thiếu ApiKey trong appsettings.json" });

            var expectedCode = !string.IsNullOrEmpty(paymentCode) ? $"RMNRES{paymentCode}" : $"RMNRES{reservationId}";

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);
            var url = $"https://my.sepay.vn/userapi/transactions/list?transaction_content={Uri.EscapeDataString(expectedCode)}";
            var response = await client.GetAsync(url);

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                Console.WriteLine($"[PaymentController] SePay API Error ({response.StatusCode}): {errorBody}");
                return StatusCode((int)response.StatusCode, new { success = false, message = $"Lỗi kết nối SePay: {response.StatusCode}" });
            }

            var json = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"[PaymentController] SePay response: {json}");
            if (string.IsNullOrEmpty(json))
                return Ok(new { success = false });

            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            // my.sepay.vn returns { "transactions": [...] }
            if (!root.TryGetProperty("transactions", out var transactionsElement))
                return Ok(new { success = false });

            foreach (var tran in transactionsElement.EnumerateArray())
            {
                // Incoming: amount_in > 0
                decimal amountIn = 0;
                if (tran.TryGetProperty("amount_in", out var amtInProp))
                    decimal.TryParse(amtInProp.GetString(), CultureInfo.InvariantCulture, out amountIn);
                if (amountIn <= 0) continue;

                var content = tran.TryGetProperty("transaction_content", out var cp) ? cp.GetString() ?? "" : "";
                if (!content.Contains(expectedCode, StringComparison.OrdinalIgnoreCase))
                    continue;

                // Match found — update reservation
                var reservation = await _context.Reservations
                    .Include(r => r.Customer)
                        .ThenInclude(c => c!.User)
                    .Include(r => r.Order)
                        .ThenInclude(o => o!.OrderItems)
                    .FirstOrDefaultAsync(r => r.ReservationId == reservationId);

                if (reservation != null && reservation.Status == "PENDING")
                {
                    reservation.Status = "CONFIRMED";
                    reservation.IsDepositPaid = true;
                    reservation.DepositAmount = amountIn;
                    reservation.DepositPaidAt = DateTime.UtcNow;
                    reservation.Note = (reservation.Note + $"\n- Đã cọc {amountIn:N0}đ qua SePay (Đối soát tự động)").Trim();
                    await _context.SaveChangesAsync();

                    try {
                        var targetEmail = reservation.ContactEmail ?? reservation.Customer?.User?.Email;
                        if (targetEmail != null) {
                            await _emailService.SendReservationConfirmationEmailAsync(
                                targetEmail,
                                reservation.CustomerName,
                                reservation.ReservationId,
                                reservation.ReservedAt,
                                reservation.PartySize,
                                amountIn,
                                _mapper.Map<List<OrderItemDTO>>(reservation.Order?.OrderItems ?? new List<OrderItem>()));
                        }
                    } catch (Exception ex) {
                        Console.WriteLine($"[PaymentController] Email error: {ex.Message}");
                    }

                    return Ok(new { success = true, message = "Payment confirmed" });
                }
            }

            return Ok(new { success = false, message = "Transaction not found yet" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    [HttpGet("sepay/check-invoice")]
    public async Task<IActionResult> CheckInvoiceSepayTransaction([FromQuery] long orderId, [FromQuery] string orderCode)
    {
        try
        {
            var apiKey = _configuration["SePay:ApiKey"];
            if (string.IsNullOrEmpty(apiKey))
                return StatusCode(500, new { success = false, message = "Thiếu ApiKey trong appsettings.json" });

            // The QR content format used in frontend: "Thanh toan hoa don {orderCode}"
            var expectedCode = orderCode;

            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", apiKey);
            var url = $"https://my.sepay.vn/userapi/transactions/list?transaction_content={Uri.EscapeDataString(expectedCode)}";
            var response = await client.GetAsync(url);

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync();
                return StatusCode((int)response.StatusCode, new { success = false, message = $"Lỗi kết nối SePay: {response.StatusCode}" });
            }

            var json = await response.Content.ReadAsStringAsync();
            if (string.IsNullOrEmpty(json))
                return Ok(new { success = false });

            using var doc = JsonDocument.Parse(json);
            var root = doc.RootElement;

            if (!root.TryGetProperty("transactions", out var transactionsElement))
                return Ok(new { success = false });

            foreach (var tran in transactionsElement.EnumerateArray())
            {
                decimal amountIn = 0;
                if (tran.TryGetProperty("amount_in", out var amtInProp))
                    decimal.TryParse(amtInProp.GetString(), CultureInfo.InvariantCulture, out amountIn);
                
                if (amountIn <= 0) continue;

                var content = tran.TryGetProperty("transaction_content", out var cp) ? cp.GetString() ?? "" : "";
                if (!content.Contains(expectedCode, StringComparison.OrdinalIgnoreCase))
                    continue;

                // Found a successful incoming transaction matching the order code
                return Ok(new { success = true, amount = amountIn, message = "Thanh toán thành công" });
            }

            return Ok(new { success = false, message = "Chưa nhận được giao dịch" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }

    [HttpPost("sepay/cancel-timeout")]
    public async Task<IActionResult> CancelTimeout([FromQuery] long reservationId)
    {
        try
        {
            // We use scoped service resolution or inject IReservationService to the constructor
            // Wait, I haven't injected IReservationService, so I'll resolve it from HttpContext
            var reservationService = HttpContext.RequestServices.GetRequiredService<IReservationService>();
            var result = await reservationService.CancelUnpaidReservationAsync(reservationId);
            
            if (result)
            {
                return Ok(new { success = true, message = "Cancelled successfully" });
            }
            return Ok(new { success = false, message = "Reservation not found or not in PENDING status" });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { success = false, message = ex.Message });
        }
    }
}
