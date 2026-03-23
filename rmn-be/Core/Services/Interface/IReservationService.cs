using System.Collections.Generic;
using System.Threading.Tasks;
using SEP_Restaurant_management.Core.DTOs;

namespace SEP_Restaurant_management.Core.Services.Interface;

public interface IReservationService
{
    Task<ReservationDTO> CreateReservationAsync(long customerId, CreateReservationRequest request);
    Task<List<ReservationDTO>> GetCustomerReservationsAsync(long customerId);
    Task<List<ReservationDTO>> GetAllReservationsAsync();
    Task<ReservationDTO?> GetReservationByIdAsync(long reservationId);
    Task<bool> CancelReservationAsync(long reservationId, long customerId);
    Task<bool> CancelUnpaidReservationAsync(long reservationId);
    Task<bool> UpdateReservationStatusAsync(long id, string status, int? tableId = null);
    Task<bool> UpdateReservationItemsAsync(long reservationId, long customerId, List<OrderItemRequest> newItems);
}
