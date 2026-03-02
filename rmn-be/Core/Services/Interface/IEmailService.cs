namespace SEP_Restaurant_management.Core.Services.Interface;

public interface IEmailService
{
    Task SendEmailAsync(string email, string subject, string htmlMessage);
}
