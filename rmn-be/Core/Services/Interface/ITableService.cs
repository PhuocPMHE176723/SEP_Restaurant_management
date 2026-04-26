using rmn_be.Core.DTOs;

namespace rmn_be.Core.Services.Interface
{
    public interface ITableService
    {
        Task<ReservationAssignTablesResponseDTO> GetAssignableTablesAsync(long reservationId);

        Task<bool> AssignTablesAsync(long reservationId, AssignTablesRequestDTO request);
        Task<long> CheckInReservationAsync(long reservationId);
    }
}
