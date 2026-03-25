using Microsoft.Extensions.Options;
using SEP_Restaurant_management.Core.Models;
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

    public async Task SendReservationConfirmationEmailAsync(string email, string customerName, long reservationId, DateTime reservedAt, int partySize, decimal depositAmount)
    {
        var subject = $"[Nhà Hàng Khói Quê] Xác nhận đặt bàn thành công #{reservationId}";
        
        var htmlMessage = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;'>
                <div style='background-color: #f7a048; padding: 20px; text-align: center; color: white;'>
                    <h2 style='margin: 0;'>Xác Nhận Đặt Bàn</h2>
                </div>
                <div style='padding: 20px; color: #333; line-height: 1.6;'>
                    <p>Chào anh/chị <strong>{customerName}</strong>,</p>
                    <p>Cảm ơn anh/chị đã đặt bàn tại Nhà Hàng Khói Quê. Dưới đây là thông tin chi tiết:</p>
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
                            <td style='padding: 8px 0; border-bottom: 1px solid #eee;'><strong>Tuỳ chọn Đặt trước:</strong></td>
                            <td style='padding: 8px 0; border-bottom: 1px solid #eee; text-align: right; color: #2e7d32;'>Đã hoàn tất cọc {depositAmount:N0}đ</td>
                        </tr>
                    </table>
                    <p>Chúc anh/chị ngon miệng và có trải nghiệm tuyệt vời tại Nhà Hàng Khói Quê!</p>
                </div>
                <div style='background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #888;'>
                    <p style='margin: 0;'>Nhà Hàng Khói Quê - 123 Đống Đa, Hà Nội<br>Hotline: 0900 123 456</p>
                </div>
            </div>";

        await SendEmailAsync(email, subject, htmlMessage);
    }
}
