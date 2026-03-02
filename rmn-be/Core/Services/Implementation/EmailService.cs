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
}
