using System.Collections.Generic;
using System.Threading.Tasks;
using SEP_Restaurant_management.Core.DTOs;

namespace SEP_Restaurant_management.Core.Services.Interface;

public interface IReservationService
{
    Task<ReservationDTO> CreateReservationAsync(long customerId, CreateReservationRequest request);
    Task<List<ReservationDTO>> GetCustomerReservationsAsync(long customerId);
    Task<List<ReservationDTO>> GetAllReservationsAsync(
        DateTime? startDate = null,
        DateTime? endDate = null
    );
    Task<ReservationDTO?> GetReservationByIdAsync(long reservationId);
    Task<bool> CancelReservationAsync(long reservationId, long customerId);
    Task<bool> CancelUnpaidReservationAsync(long reservationId);
    Task<long?> UpdateReservationStatusAsync(long id, string status, List<int>? tableIds = null);
    Task<bool> UpdateReservationItemsAsync(
        long reservationId,
        long customerId,
        List<OrderItemRequest> newItems
    );
}
