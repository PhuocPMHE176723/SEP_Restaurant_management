using Microsoft.Extensions.Options;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Services.Interface;
using System.Net;
using System.Net.Mail;

namespace SEP_Restaurant_management.Core.Services.Implementation;

public class EmailService : IEmailService
{
    private readonly MailSettings _mailSettings;

    public EmailService(IOptions<MailSettings> mailSettings)
    {
        _mailSettings = mailSettings.Value;
    }

    public async Task SendEmailAsync(string email, string subject, string htmlMessage)
    {
        var client = new SmtpClient(_mailSettings.Host, _mailSettings.Port)
        {
            Credentials = new NetworkCredential(_mailSettings.Mail, _mailSettings.Password),
            EnableSsl = true
        };
        var mailMessage = new MailMessage
        {
            From = new MailAddress(_mailSettings.Mail, _mailSettings.DisplayName),
            Subject = subject,
            Body = htmlMessage,
            IsBodyHtml = true
        };

        mailMessage.To.Add(email);

        await client.SendMailAsync(mailMessage);
    }

    public async Task SendReservationConfirmationEmailAsync(string email, string customerName, long reservationId, DateTime reservedAt, int partySize, decimal depositAmount, List<OrderItemDTO> items)
    {
        var subject = $"[Nhà Hàng Khói Quê] Xác nhận đặt bàn thành công #{reservationId}";
        
        var totalAmount = items != null && items.Count > 0 
            ? items.Sum(i => i.UnitPrice * i.Quantity) 
            : depositAmount; // If no items, total recorded is just the deposit
            
        var remainingAmount = items != null && items.Count > 0 ? totalAmount - depositAmount : 0;
        var totalQuantity = items?.Sum(i => i.Quantity) ?? 0;

        var itemsHtml = string.Empty;
        if (items != null && items.Count > 0)
        {
            itemsHtml = @"<div style='margin-top: 15px;'><h4 style='margin-bottom: 5px;'>Danh sách món đã đặt:</h4>" +
                        "<table style='width:100%; border-collapse: collapse; font-size: 14px;'>" +
                        "<tr style='background-color: #f9f9f9;'><th style='padding: 8px; border: 1px solid #eee; text-align: left;'>Món</th><th style='padding: 8px; border: 1px solid #eee; text-align: center;'>Số lượng</th><th style='padding: 8px; border: 1px solid #eee; text-align: right;'>Đơn giá</th></tr>";
            foreach (var item in items)
            {
                itemsHtml += $"<tr><td style='padding: 8px; border: 1px solid #eee;'>{item.ItemNameSnapshot}</td><td style='padding: 8px; border: 1px solid #eee; text-align: center;'>{item.Quantity}</td><td style='padding: 8px; border: 1px solid #eee; text-align: right;'>{item.UnitPrice:N0}đ</td></tr>";
            }
            itemsHtml += "</table></div>";
        }
        
        var htmlMessage = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;'>
                <div style='background-color: #f7a048; padding: 20px; text-align: center; color: white;'>
                    <h2 style='margin: 0;'>Xác Nhận Đặt Bàn Thành Công</h2>
                </div>
                <div style='padding: 20px; color: #333; line-height: 1.6;'>
                    <p>Chào anh/chị <strong>{customerName}</strong>,</p>
                    <p>Cảm ơn anh/chị đã hoàn tất thanh toán cọc. Đơn đặt bàn của anh/chị hiện đã được <strong>XÁC NHẬN</strong>. Dưới đây là thông tin chi tiết:</p>
                    <table style='width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 20px;'>
                        <tr>
                            <td style='padding: 8px 0; border-bottom: 1px solid #eee;'><strong>Mã đặt bàn:</strong></td>
                            <td style='padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;'>#{reservationId}</td>
                        </tr>
                        <tr>
                            <td style='padding: 8px 0; border-bottom: 1px solid #eee;'><strong>Thời gian:</strong></td>
                            <td style='padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;'>{reservedAt:dd/MM/yyyy HH:mm}</td>
                        </tr>
                        <tr>
                            <td style='padding: 8px 0; border-bottom: 1px solid #eee;'><strong>Số khách:</strong></td>
                            <td style='padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;'>{partySize} người</td>
                        </tr>
                         <tr>
                            <td style='padding: 8px 0; border-bottom: 1px solid #eee;'><strong>Tổng cộng đơn:</strong></td>
                            <td style='padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;'>{totalAmount:N0}đ</td>
                        </tr>
                        {(totalQuantity > 0 ? $@"
                        <tr>
                            <td style='padding: 8px 0; border-bottom: 1px solid #eee;'><strong>Số món đã đặt:</strong></td>
                            <td style='padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;'>{totalQuantity} món</td>
                        </tr>" : "")}
                        <tr>
                            <td style='padding: 8px 0; border-bottom: 1px solid #eee;'><strong>Số tiền đã cọc:</strong></td>
                            <td style='padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; color: #2e7d32;'>{depositAmount:N0}đ (Đã thanh toán)</td>
                        </tr>
                        <tr>
                            <td style='padding: 8px 0; border-bottom: 1px solid #eee;'><strong>Số tiền còn lại:</strong></td>
                            <td style='padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;'>{remainingAmount:N0}đ</td>
                        </tr>
                    </table>
                    {itemsHtml}
                    <p style='background-color: #fff4e5; padding: 10px; border-left: 4px solid #f7a048; font-size: 14px; margin-top: 20px;'>
                        <strong>Lưu ý:</strong> Vui lòng đến đúng giờ. Nhà hàng sẽ giữ bàn cho bạn <strong>tối đa 30 phút</strong> so với thời gian đã hẹn. Sau thời gian này, bàn đặt có thể bị hủy nếu bạn không đến.
                    </p>
                    <p>Hẹn gặp lại anh/chị tại Nhà Hàng Khói Quê!</p>
                </div>
                <div style='background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #888;'>
                    <p style='margin: 0;'>Nhà Hàng Khói Quê - 123 Đống Đa, Hà Nội<br>Hotline: 0900 123 456</p>
                </div>
            </div>";

        await SendEmailAsync(email, subject, htmlMessage);
    }

    public async Task SendReservationReceivedEmailAsync(string email, string customerName, long reservationId, DateTime reservedAt, int partySize, decimal depositAmount, List<OrderItemDTO> items)
    {
        var subject = $"[Nhà Hàng Khói Quê] Thông tin đơn đặt bàn #{reservationId}";
        
        // Sum items for total amount if items exist, otherwise fallback to deposit * 2
        var totalAmount = items != null && items.Count > 0 
            ? items.Sum(i => i.UnitPrice * i.Quantity) 
            : depositAmount; // If no items, total recorded as same as deposit
            
        var totalQuantity = items?.Sum(i => i.Quantity) ?? 0;

        var itemsHtml = string.Empty;
        if (items != null && items.Count > 0)
        {
            itemsHtml = @"<div style='margin-top: 15px;'><h4 style='margin-bottom: 5px;'>Danh sách món đã đặt:</h4>" +
                        "<table style='width:100%; border-collapse: collapse; font-size: 14px;'>" +
                        "<tr style='background-color: #f9f9f9;'><th style='padding: 8px; border: 1px solid #eee; text-align: left;'>Món</th><th style='padding: 8px; border: 1px solid #eee; text-align: center;'>Số lượng</th><th style='padding: 8px; border: 1px solid #eee; text-align: right;'>Đơn giá</th></tr>";
            foreach (var item in items)
            {
                itemsHtml += $"<tr><td style='padding: 8px; border: 1px solid #eee;'>{item.ItemNameSnapshot}</td><td style='padding: 8px; border: 1px solid #eee; text-align: center;'>{item.Quantity}</td><td style='padding: 8px; border: 1px solid #eee; text-align: right;'>{item.UnitPrice:N0}đ</td></tr>";
            }
            itemsHtml += "</table></div>";
        }
        
        var htmlMessage = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;'>
                <div style='background-color: #f7a048; padding: 20px; text-align: center; color: white;'>
                    <h2 style='margin: 0;'>Chúng Tôi Đã Tiếp Nhận Đơn Đặt Bàn</h2>
                </div>
                <div style='padding: 20px; color: #333; line-height: 1.6;'>
                    <p>Chào anh/chị <strong>{customerName}</strong>,</p>
                    <p>Hệ thống đã ghi nhận đơn đặt bàn của anh/chị. Vui lòng thanh toán tiền cọc (tối thiểu 200.000đ hoặc 20% giá trị đơn hàng) để hoàn tất xác thực đơn đặt bàn này. Dưới đây là thông tin chi tiết:</p>
                    <table style='width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 20px;'>
                        <tr>
                            <td style='padding: 8px 0; border-bottom: 1px solid #eee;'><strong>Mã đặt bàn:</strong></td>
                            <td style='padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;'>#{reservationId}</td>
                        </tr>
                        <tr>
                            <td style='padding: 8px 0; border-bottom: 1px solid #eee;'><strong>Thời gian:</strong></td>
                            <td style='padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;'>{reservedAt:dd/MM/yyyy HH:mm}</td>
                        </tr>
                        <tr>
                            <td style='padding: 8px 0; border-bottom: 1px solid #eee;'><strong>Số khách:</strong></td>
                            <td style='padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;'>{partySize} người</td>
                        </tr>
                         <tr>
                            <td style='padding: 8px 0; border-bottom: 1px solid #eee;'><strong>Tổng cộng đơn:</strong></td>
                            <td style='padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;'>{totalAmount:N0}đ</td>
                        </tr>
                        {(totalQuantity > 0 ? $@"
                        <tr>
                            <td style='padding: 8px 0; border-bottom: 1px solid #eee;'><strong>Số món đã đặt:</strong></td>
                            <td style='padding: 8px 0; border-bottom: 1px solid #eee; text-align: right;'>{totalQuantity} món</td>
                        </tr>" : "")}
                        <tr>
                            <td style='padding: 8px 0; border-bottom: 1px solid #eee;'><strong>Tiền cọc cần thanh toán:</strong></td>
                            <td style='padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; color: #d32f2f;'>{depositAmount:N0}đ</td>
                        </tr>
                    </table>
                    {itemsHtml}
                    <p style='background-color: #fff4e5; padding: 10px; border-left: 4px solid #f7a048; font-size: 14px; margin-top: 20px;'>
                        <strong>Lưu ý quan trọng:</strong><br>
                        - Nhà hàng sẽ giữ bàn cho bạn <strong>tối đa 30 phút</strong> so với thời gian đã hẹn.<br>
                        - Đơn đặt bàn sẽ được hệ thống tạm giữ trong vòng 5 phút để chờ thanh toán cọc.
                    </p>
                </div>
                <div style='background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #888;'>
                    <p style='margin: 0;'>Nhà Hàng Khói Quê - 123 Đống Đa, Hà Nội<br>Hotline: 0900 123 456</p>
                </div>
            </div>";

        await SendEmailAsync(email, subject, htmlMessage);
    }
    // Test mail lỗi đăng nhập mail
    public async Task SendEmailNewAsync(string toEmail, string subject, string htmlBody)
    {
        var fromEmail = "huyvu20704@gmail.com";
        var appPassword = "dvcg taht jqvb fpcw";

        using var client = new SmtpClient("smtp.gmail.com", 587)
        {
            UseDefaultCredentials = false,
            Credentials = new NetworkCredential(fromEmail, appPassword),
            EnableSsl = true,
            DeliveryMethod = SmtpDeliveryMethod.Network
        };

        using var message = new MailMessage
        {
            From = new MailAddress(fromEmail, "RMN Restaurant"),
            Subject = subject,
            Body = htmlBody,
            IsBodyHtml = true
        };

        message.To.Add(toEmail);

        await client.SendMailAsync(message);
    }

    public async Task SendEmailVerificationOtpAsync(string email, string fullName, string otpCode)
    {
        var subject = "[Nhà Hàng Khói Quê] Mã OTP xác nhận email";

        var htmlMessage = $@"
        <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;'>
            <div style='background: #f97316; color: white; padding: 20px; text-align: center;'>
                <h2 style='margin: 0;'>Xác nhận đăng ký tài khoản</h2>
            </div>
            <div style='padding: 24px; color: #111827; line-height: 1.6;'>
                <p>Xin chào <strong>{fullName}</strong>,</p>
                <p>Bạn vừa đăng ký tài khoản tại Nhà Hàng Khói Quê.</p>
                <p>Vui lòng nhập mã OTP bên dưới để xác thực email:</p>

                <div style='margin: 24px 0; text-align: center;'>
                    <div style='display: inline-block; font-size: 32px; letter-spacing: 8px; font-weight: bold; color: #f97316; padding: 14px 24px; border: 2px dashed #fdba74; border-radius: 12px; background: #fff7ed;'>
                        {otpCode}
                    </div>
                </div>

                <p>Mã OTP có hiệu lực trong <strong>5 phút</strong>.</p>
                <p>Nếu bạn không thực hiện thao tác này, vui lòng bỏ qua email.</p>
            </div>
            <div style='background: #f9fafb; padding: 14px; text-align: center; font-size: 12px; color: #6b7280;'>
                Nhà Hàng Khói Quê
            </div>
        </div>";

        await SendEmailNewAsync(email, subject, htmlMessage);
    }
}
