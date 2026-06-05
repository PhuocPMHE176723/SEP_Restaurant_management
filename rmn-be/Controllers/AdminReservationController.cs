using System;
using System.Net.NetworkInformation;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Middlewares;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Services.Implementation;
using SEP_Restaurant_management.Core.Services.Interface;

namespace SEP_Restaurant_management.Controllers;

[Route("api/[controller]")]
[Authorize(Roles = "Admin,Manager,Staff,Cashier")]
public class AdminReservationController : BaseController
{
    private readonly IReservationService _reservationService;
    private readonly SepDatabaseContext _context;
    private readonly IEmailService _emailService;
    private readonly INotificationService _notificationService;
    public AdminReservationController(IReservationService reservationService, SepDatabaseContext context, IEmailService emailService, INotificationService notificationService)
    {
        _reservationService = reservationService;
        _context = context;
        _emailService = emailService;
        _notificationService = notificationService;
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
    CancelReservationRequest request)
    {
        var reservation = await _context.Reservations.FindAsync(id);

        if (reservation == null)
        {
            return NotFound();
        }

        var order = await _context.Orders
            .FirstOrDefaultAsync(o => o.ReservationId == id);

        var now = DateTimeHelper.VietnamNow();

        decimal refundAmount = 0;
        string cancelType = "";
        string emailSubject = "";
        string html = "";

        var reservationDate = reservation.ReservedAt.Date;

        // Xác định ca của ngày đặt
        var morningShiftStart = reservationDate.AddHours(11); // 11:00
        var eveningShiftStart = reservationDate.AddHours(17); // 17:00

        bool isMorningReservation =
            reservation.ReservedAt.Hour >= 11 &&
            reservation.ReservedAt.Hour < 17;

        bool isEveningReservation =
            reservation.ReservedAt.Hour >= 17;

        // =====================================================
        // CASE 1: KHÁCH KHÔNG ĐẾN
        // Quá giờ đặt 1 tiếng
        // =====================================================
        if (now >= reservation.ReservedAt.AddHours(1))
        {
            cancelType = "NO_SHOW";

            reservation.Status = "CANCELLED";

            refundAmount = 0;

            reservation.RefundAmount = refundAmount;

            emailSubject =
                "[Nhà Hàng Khói Quê] Đơn đặt bàn đã hết hiệu lực";

            html = $@"
<div style='font-family:Arial,sans-serif;padding:24px;background:#f9fafb;color:#111827;line-height:1.6'>

    <div style='max-width:600px;margin:auto;background:white;
                border-radius:16px;padding:32px;
                box-shadow:0 2px 8px rgba(0,0,0,0.05)'>

        <h2 style='color:#dc2626;margin-bottom:24px'>
            ⏰ Thông báo đơn đặt bàn hết hiệu lực
        </h2>

        <p>
            Xin chào <b>{reservation.CustomerName}</b>,
        </p>

        <p>
            Chúng tôi ghi nhận Quý khách chưa thực hiện check-in cho đơn đặt bàn đã xác nhận.
        </p>

        <div style='background:#f8fafc;
                    border:1px solid #e5e7eb;
                    padding:20px;
                    border-radius:12px;
                    margin:24px 0'>

            <p style='margin:8px 0'>
                <b>Mã đặt bàn:</b> #{order?.OrderCode}
            </p>

            <p style='margin:8px 0'>
                <b>Thời gian đặt bàn:</b>
                {reservation.ReservedAt:dd/MM/yyyy HH:mm}
            </p>

            <p style='margin:8px 0'>
                <b>Thời gian ghi nhận:</b>
                {now:dd/MM/yyyy HH:mm:ss}
            </p>
        </div>

        <div style='background:#fef2f2;
                    border:1px solid #fca5a5;
                    padding:20px;
                    border-radius:12px;
                    margin-top:20px'>

            <p style='margin-top:0'>
                <b>Trạng thái đơn đặt bàn</b>
            </p>

            <p>
                Do Quý khách không check-in trong vòng <b>01 giờ</b>
                kể từ thời gian đặt bàn, hệ thống đã tự động chuyển đơn sang trạng thái
                <b>NO SHOW</b> và giải phóng bàn để phục vụ các khách hàng khác.
            </p>

            <p>
                Theo chính sách đặt bàn của nhà hàng, khoản tiền cọc của đơn đặt bàn này
                sẽ không được hoàn lại.
            </p>

            <p style='margin-bottom:0'>
                <b>Số tiền hoàn:</b>
                <span style='color:#dc2626'>0 VNĐ</span>
            </p>
        </div>

        <p style='margin-top:32px'>
            Chúng tôi rất mong sẽ tiếp tục được phục vụ Quý khách trong những lần đặt bàn tiếp theo.
        </p>

        <p>
            Nếu Quý khách cho rằng đây là sự nhầm lẫn hoặc cần hỗ trợ thêm,
            vui lòng liên hệ nhà hàng để được kiểm tra và hỗ trợ.
        </p>

        <p style='margin-top:32px;color:#6b7280;font-size:14px'>
            Trân trọng,<br/>
            <b>Nhà hàng Khói Quê</b>
        </p>

    </div>

</div>";
        }

        // =====================================================
        // CASE 2: NHÀ HÀNG HUỶ
        // Chưa tới ngày đặt
        // hoặc cùng ngày nhưng chưa vào ca
        // =====================================================
        else if (
            now.Date < reservationDate
            ||
            (
                now.Date == reservationDate
                &&
                (
                    (isMorningReservation && now < morningShiftStart)
                    ||
                    (isEveningReservation && now < eveningShiftStart)
                )
            )
        )
        {
            cancelType = "RESTAURANT_CANCEL";

            reservation.Status = "CANCELLED";

            refundAmount = reservation.DepositAmount;

            reservation.RefundAmount = refundAmount;

            emailSubject =
                "[Nhà Hàng Khói Quê] Thông báo huỷ đặt bàn";

            html = $@"
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
                <b>Mã đặt bàn:</b> #{order?.OrderCode}
            </p>

            <p style='margin:8px 0'>
                <b>Thời gian huỷ:</b>
                {now:dd/MM/yyyy HH:mm:ss}
            </p>

            <p style='margin:8px 0'>
                <b>Lý do huỷ:</b>
                {request.Reason}
            </p>

            {(string.IsNullOrWhiteSpace(request.Detail)
                ? ""
                : $"<p style='margin:8px 0;color:#6b7280'>{request.Detail}</p>")}
        </div>

        <div style='background:#fff7ed;
                    border:1px solid #fdba74;
                    padding:20px;
                    border-radius:12px;
                    margin-top:20px'>

            <p style='margin-top:0'>
                💳 <b>Thông tin hoàn tiền</b>
            </p>

            <p>
                Quý khách có khoản tiền cọc cần được hoàn lại:
            </p>

            <p style='font-size:20px;
                      font-weight:bold;
                      color:#16a34a;
                      margin:12px 0'>
                {refundAmount:N0} VNĐ
            </p>

            <p>
                Bộ phận chăm sóc khách hàng của nhà hàng sẽ chủ động liên hệ với Quý khách
                trong thời gian sớm nhất để xác nhận thông tin và thực hiện hoàn tiền.
            </p>

            <p>
                Vui lòng giữ điện thoại trong thời gian tới hoặc kiểm tra email thường xuyên
                để thuận tiện cho quá trình hỗ trợ.
            </p>

            <p style='margin-bottom:0'>
                Nếu cần hỗ trợ gấp, Quý khách có thể liên hệ trực tiếp với nhà hàng để được hỗ trợ nhanh hơn.
            </p>
        </div>

        <p style='margin-top:32px'>
            Chúng tôi chân thành xin lỗi vì sự bất tiện này và rất mong có cơ hội được phục vụ Quý khách trong thời gian tới.
        </p>

        <p style='margin-top:32px;color:#6b7280;font-size:14px'>
            Trân trọng,<br/>
            <b>Nhà hàng Khói Quê</b>
        </p>

    </div>

</div>";
        }

        // =====================================================
        // CASE 3: ĐÃ VÀO CA
        // KHÔNG CHO HUỶ
        // =====================================================
        else
        {
            return BadRequest(new
            {
                message = "Đơn đặt bàn đã vào ca phục vụ, không thể huỷ."
            });
        }

        // Lưu số tiền hoàn
        reservation.RefundAmount = refundAmount;

        var cancelLog = $@"

[HUỶ ĐẶT BÀN]
Loại huỷ: {cancelType}
Lý do: {request.Reason}
Chi tiết: {request.Detail}
Số tiền hoàn: {refundAmount:N0} VNĐ
Thời gian huỷ: {now:dd/MM/yyyy HH:mm:ss}
";

        reservation.Note = string.IsNullOrWhiteSpace(reservation.Note)
            ? cancelLog.Trim()
            : reservation.Note + cancelLog;

        await _context.SaveChangesAsync();

        if (!string.IsNullOrWhiteSpace(reservation.ContactEmail))
        {
            await _emailService.SendEmailNewAsync(
                reservation.ContactEmail,
                emailSubject,
                html
            );
        }

        string? customerUserId = null;
        if (reservation.CustomerId.HasValue)
        {
            var customer = await _context.Customers.FindAsync(reservation.CustomerId.Value);
            customerUserId = customer?.UserId;
        }

        if (!string.IsNullOrEmpty(customerUserId))
        {
            await _notificationService.CreateNotificationAsync(
            title: "Cập nhật đơn đặt bàn",
                message: $"Đơn đặt bàn lúc {now:dd/MM/yyyy HH:mm} của bạn đã bị huỷ.",
                type: "RESERVATION",
                userId: customerUserId,
                relatedId: reservation.ReservationId.ToString()
            );
        }

        await _notificationService.CreateNotificationAsync(
        title: "Cập nhật đơn đặt bàn",
            message: $"Đơn đặt bàn của {reservation.CustomerName} lúc {now:dd/MM/yyyy HH:mm} đã bị huỷ.",
            type: "RESERVATION",
            role: "Staff",
            relatedId: reservation.ReservationId.ToString()
        );

        return Ok(new
        {
            ReservationId = reservation.ReservationId,
            Status = reservation.Status,
            RefundAmount = reservation.RefundAmount,
            CancelType = cancelType
        });
    }
    public class RefundRequest
    {
        public IFormFile? refundProff { get; set; }
        public string RefundMethod { get; set; } = string.Empty;
    }
    private async Task<string> SaveRefundImage(IFormFile file)
    {
        var folder = Path.Combine(
            Directory.GetCurrentDirectory(),
            "wwwroot",
            "uploads",
            "refunds");

        if (!Directory.Exists(folder))
        {
            Directory.CreateDirectory(folder);
        }

        var fileName =
            $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";

        var path = Path.Combine(folder, fileName);

        using (var stream = new FileStream(path, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        return $"/uploads/refunds/{fileName}";
    }
    [HttpPost("{id}/refund")]
    [Authorize(Roles = "Admin,Manager,Cashier")]
    public async Task<IActionResult> RefundReservation(
    long id,
    [FromForm] RefundRequest request)
    {
        Console.WriteLine($"Method: {request.RefundMethod}");
        Console.WriteLine($"File null: {request.refundProff == null}");
        var reservation = await _context.Reservations
            .FirstOrDefaultAsync(x => x.ReservationId == id);

        if (reservation == null)
        {
            return NotFoundResponse("Reservation not found");
        }

        if (reservation.IsRefund)
        {
            return BadRequest("Đơn này đã được hoàn tiền");
        }

        if (reservation.Status != "CANCELLED")
        {
            return BadRequest("Chỉ đơn đã huỷ mới được hoàn tiền");
        }

        string? imageUrl = null;

        if (request.refundProff != null)
        {
            imageUrl = await SaveRefundImage(request.refundProff);
        }

        reservation.IsRefund = true;
        reservation.Refund_proof_url = imageUrl;
        reservation.Refund_note = "Đã hoàn "+reservation.RefundAmount+" bằng "+ request.RefundMethod;

        await _context.SaveChangesAsync();

        return Ok(
            new
            {
                reservation.ReservationId,
                reservation.RefundAmount,
                reservation.Refund_proof_url,
                reservation.Refund_note
            });
    }
}
