namespace SEP_Restaurant_management.Core.Services.Interface;

public interface IEmailService
{
    Task SendEmailAsync(string email, string subject, string htmlMessage);
    Task SendReservationConfirmationEmailAsync(string email, string customerName, long reservationId, DateTime reservedAt, int partySize, decimal depositAmount);
    Task SendReservationReceivedEmailAsync(string email, string customerName, long reservationId, DateTime reservedAt, int partySize, decimal depositAmount);
}
