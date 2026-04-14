namespace SEP_Restaurant_management.Core.Services.Interface;

using SEP_Restaurant_management.Core.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

public interface IEmailService
{
    Task SendEmailAsync(string email, string subject, string htmlMessage);
    Task SendReservationConfirmationEmailAsync(string email, string customerName, long reservationId, DateTime reservedAt, int partySize, decimal depositAmount, List<OrderItemDTO> items);
    Task SendReservationReceivedEmailAsync(string email, string customerName, long reservationId, DateTime reservedAt, int partySize, decimal depositAmount, List<OrderItemDTO> items);
    Task SendEmailNewAsync(string email, string subject, string htmlMessage);
    Task SendEmailVerificationOtpAsync(string email, string fullName, string otpCode);
}
