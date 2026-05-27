using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Middlewares;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Services.Interface;

namespace SEP_Restaurant_management.Controllers;

[Route("api/[controller]")]
[Authorize(Roles = "Admin,Manager,Staff,Cashier")]
public class AdminReservationController : BaseController
{
    private readonly IReservationService _reservationService;
    private readonly SepDatabaseContext _context;
    private readonly IEmailService _emailService;
    public AdminReservationController(IReservationService reservationService, SepDatabaseContext context, IEmailService emailService)
    {
        _reservationService = reservationService;
        _context = context;
        _emailService = emailService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllReservations(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null
    )
    {
        try
        {
            var reservations = await _reservationService.GetAllReservationsAsync(
                startDate,
                endDate
            );
            return Success(reservations);
        }
        catch (Exception ex)
        {
            return Failure(ex.Message);
        }
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(
        long id,
        [FromBody] UpdateReservationStatusRequest request
    )
    {
        try
        {
            var orderId = await _reservationService.UpdateReservationStatusAsync(
                id,
                request.Status,
                request.TableIds
            );
            if (orderId == null)
            {
                return Failure("Reservation or table not found or invalid status");
            }

            return Success(
                new { orderId = orderId > 0 ? orderId : null },
                "Reservation updated successfully"
            );
        }
        catch (Exception ex)
        {
            return Failure(ex.Message);
        }
    }

    public class CancelReservationRequest
    {
        public string Reason { get; set; } = default!;
        public string? Detail { get; set; }
    }
    [HttpPut("{id}/cancel")]
    public async Task<IActionResult> CancelReservation(
    long id,
    CancelReservationRequest request
)
    {
        var cancelLog = $@"

[HUỶ ĐẶT BÀN]
Lý do: {request.Reason} - {request.Detail}
Thời gian huỷ: {DateTimeHelper.VietnamNow():dd/MM/yyyy HH:mm:ss}";
        var reservation = await _context.Reservations.FindAsync(id);
        var order = await _context.Orders
    .FirstOrDefaultAsync(o => o.ReservationId == id);
        if (reservation == null)
        {
            return NotFound();
        }

        reservation.Status = "CANCELLED";
        reservation.Note = string.IsNullOrWhiteSpace(reservation.Note)
    ? cancelLog.Trim()
    : reservation.Note + cancelLog;

        await _context.SaveChangesAsync();
        if (!string.IsNullOrWhiteSpace(reservation.ContactEmail))
        {
            var html = $@"
<div style='font-family:Arial,sans-serif;padding:24px;background:#f9fafb;color:#111827;line-height:1.6'>
    
    <div style='max-width:600px;margin:auto;background:white;
                border-radius:16px;padding:32px;
                box-shadow:0 2px 8px rgba(0,0,0,0.05)'>

        <h2 style='color:#dc2626;margin-bottom:24px'>
            ❌ Thông báo huỷ đặt bàn
        </h2>

        <p>
            Xin chào <b>{reservation.CustomerName}</b>,
        </p>

        <p>
            Nhà hàng rất tiếc phải thông báo rằng đơn đặt bàn của Quý khách đã được huỷ.
        </p>

        <div style='background:#f8fafc;
                    border:1px solid #e5e7eb;
                    padding:20px;
                    border-radius:12px;
                    margin:24px 0'>

            <p style='margin:8px 0'>
                <b>Mã đặt bàn:</b> #{order.OrderCode}
            </p>

            <p style='margin:8px 0'>
                <b>Thời gian huỷ:</b> 
                {DateTimeHelper.VietnamNow():dd/MM/yyyy HH:mm:ss}
            </p>

            <p style='margin:8px 0'>
                <b>Lý do huỷ:</b><br/>
                {request.Reason}
            </p>

            <p style='margin:8px 0;color:#6b7280'>
                {request.Detail}
            </p>
        </div>

        <div style='background:#fff7ed;
                    border:1px solid #fdba74;
                    padding:16px;
                    border-radius:12px;
                    margin-top:20px'>

            <p style='margin-top:0'>
                💳 <b>Hỗ trợ hoàn tiền tiền cọc</b>
            </p>

            <p>
                Nếu đơn đặt bàn của Quý khách có phát sinh tiền cọc,
                vui lòng liên hệ số điện thoại 
                <b>{{RestaurantPhoneNumber}}</b>
                để được hỗ trợ hoàn tiền trong thời gian sớm nhất.
            </p>

            <p style='margin-bottom:8px'>
                Khi liên hệ, Quý khách vui lòng cung cấp:
            </p>

            <ul style='padding-left:20px;margin-top:0'>
                <li>Mã đặt bàn</li>
                <li>Họ và tên</li>
                <li>Số điện thoại đặt bàn</li>
                <li>Thông tin tài khoản nhận hoàn tiền (nếu cần)</li>
            </ul>
        </div>

        <p style='margin-top:32px'>
            Nhà hàng xin lỗi vì sự bất tiện này và rất mong sẽ tiếp tục được phục vụ Quý khách trong thời gian tới.
        </p>

        <p style='margin-top:32px;color:#6b7280;font-size:14px'>
            Trân trọng,<br/>
            <b>{{RestaurantName}}</b>
        </p>
    </div>
</div>
";

            await _emailService.SendEmailNewAsync(
                reservation.ContactEmail,
                "[Nhà Hàng Khói Quê] Thông báo huỷ đơn",
                html
            );
        }

        return Ok();
    }
}
