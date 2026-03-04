using System.Collections.Generic;
using System.Threading.Tasks;
using SEP_Restaurant_management.Core.DTOs;

namespace SEP_Restaurant_management.Core.Services.Interface;

public interface IReservationService
{
    Task<ReservationDTO> CreateReservationAsync(long customerId, CreateReservationRequest request);
    Task<List<ReservationDTO>> GetCustomerReservationsAsync(long customerId);
    Task<ReservationDTO?> GetReservationByIdAsync(long reservationId);
    Task<bool> CancelReservationAsync(long reservationId, long customerId);
}
