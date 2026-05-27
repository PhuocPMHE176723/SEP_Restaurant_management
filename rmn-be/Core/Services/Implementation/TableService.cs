using Microsoft.EntityFrameworkCore;
using rmn_be.Core.DTOs;
using rmn_be.Core.Services.Interface;
using SEP_Restaurant_management.Core.Middlewares;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Services.Interface;

namespace rmn_be.Core.Services.Implementation
{
    public class TableService : ITableService
    {
        private readonly SepDatabaseContext _context;
        private readonly INotificationService _notificationService;
        public TableService(SepDatabaseContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }
        private static DateTime GetAssignmentBlockEnd(DateTime reservedAt)
        {
            var time = reservedAt.TimeOfDay;

            // Ca sáng: 11:00 - 14:00 => giữ bàn 2.5 tiếng
            if (time >= new TimeSpan(11, 0, 0) && time <= new TimeSpan(14, 0, 0))
            {
                return reservedAt.AddHours(2.5);
            }

            // Ca chiều: 17:00 - 22:00 => giữ bàn 4 tiếng
            if (time >= new TimeSpan(17, 0, 0) && time <= new TimeSpan(22, 0, 0))
            {
                return reservedAt.AddHours(4);
            }

            return reservedAt.AddMinutes(90);
        }

        private static bool IsOverlapping(DateTime start1, DateTime end1, DateTime start2, DateTime end2)
        {
            return start1 < end2 && start2 < end1;
        }

        private static string GetShift(DateTime reservedAt)
        {
            var time = reservedAt.TimeOfDay;

            if (time >= new TimeSpan(11, 0, 0) && time <= new TimeSpan(14, 0, 0))
            {
                return "Sáng";
            }

            if (time >= new TimeSpan(17, 0, 0) && time <= new TimeSpan(22, 0, 0))
            {
                return "Chiều";
            }

            return "Khác";
        }
        public async Task<ReservationAssignTablesResponseDTO> GetAssignableTablesAsync(long reservationId)
        {
            var reservation = await _context.Reservations
                .FirstOrDefaultAsync(r => r.ReservationId == reservationId);

            if (reservation == null)
            {
                throw new Exception("Reservation not found");
            }

            var order = await _context.Orders
                .Include(o => o.OrderTables)
                .FirstOrDefaultAsync(o => o.ReservationId == reservationId);

            var selectedTableIds = order?.OrderTables
                .Select(ot => ot.TableId)
                .ToList() ?? new List<int>();

            var targetStart = reservation.ReservedAt;
            var targetEnd = GetAssignmentBlockEnd(targetStart);

            var tables = await _context.DiningTables
                .Where(t => t.IsActive)
                .OrderBy(t => t.TableId)
                .ToListAsync();

            var otherReservationOrders = await _context.Orders
                .Include(o => o.OrderTables)
                .Include(o => o.Reservation)
                .Where(o =>
                    o.ReservationId != null &&
                    o.ReservationId != reservationId &&
                    o.Reservation != null &&
                    o.Reservation.Status != "CANCELLED" &&
                    o.Reservation.Status != "COMPLETED" &&
                    o.Reservation.Status != "NO_SHOW")
                .ToListAsync();

            var tableDtos = new List<AssignableTableDTO>();

            foreach (var table in tables)
            {
                var isOccupied = table.Status == "OCCUPIED";
                var isAlreadySelectedForThisReservation = selectedTableIds.Contains(table.TableId);

                var conflictOrder = otherReservationOrders.FirstOrDefault(o =>
                    o.OrderTables.Any(ot => ot.TableId == table.TableId) &&
                    IsOverlapping(
                        targetStart,
                        targetEnd,
                        o.Reservation!.ReservedAt,
                        GetAssignmentBlockEnd(o.Reservation.ReservedAt)
                    )
                );

                var isReservedByOther = conflictOrder != null;

                var isSelectable =
                    !isOccupied &&
                    (!isReservedByOther || isAlreadySelectedForThisReservation);

                string statusMessage;

                if (isAlreadySelectedForThisReservation)
                {
                    statusMessage = "Đang gán cho đơn này";
                }
                else if (isOccupied)
                {
                    statusMessage = "Đang có khách";
                }
                else if (isReservedByOther)
                {
                    statusMessage = "Bàn đã được đặt trước";
                }
                else
                {
                    statusMessage = "Sẵn sàng";
                }

                tableDtos.Add(new AssignableTableDTO
                {
                    TableId = table.TableId,
                    TableCode = table.TableCode,
                    TableName = table.TableName ?? table.TableCode,
                    Capacity = table.Capacity,
                    IsOccupied = isOccupied,
                    IsReserved = isReservedByOther,
                    IsSelectable = isSelectable,
                    StatusMessage = statusMessage,
                    ConflictReservationId = conflictOrder?.ReservationId,
                    ConflictCustomerName = conflictOrder?.Reservation?.CustomerName
                });
            }

            return new ReservationAssignTablesResponseDTO
            {
                ReservationId = reservation.ReservationId,
                ReservationCode = $"#{reservation.ReservationId}",
                CustomerName = reservation.CustomerName,
                NumberOfGuest = reservation.PartySize,
                NumberOfTable = reservation.TotalTables,
                table8Count = reservation.Table8Count,
                table6Count = reservation.Table6Count,
                table4Count = reservation.Table4Count,
                ReservedAt = reservation.ReservedAt,
                Shift = GetShift(reservation.ReservedAt),
                SelectedTableIds = selectedTableIds,
                Tables = tableDtos
            };
        }
        public async Task<bool> AssignTablesAsync(long reservationId, AssignTablesRequestDTO request)
        {
            if (request.TableIds == null || !request.TableIds.Any())
            {
                throw new Exception("Vui lòng chọn ít nhất một bàn");
            }

            var distinctTableIds = request.TableIds.Distinct().ToList();

            var reservation = await _context.Reservations
                .FirstOrDefaultAsync(r => r.ReservationId == reservationId);

            if (reservation == null)
            {
                throw new Exception("Reservation not found");
            }

            if (reservation.Status == "CANCELLED" ||
                reservation.Status == "COMPLETED" ||
                reservation.Status == "NO_SHOW")
            {
                throw new Exception("Không thể gán bàn cho đơn đặt bàn đã kết thúc hoặc đã hủy");
            }

            var requestedTableTypeCount =
    reservation.Table4Count +
    reservation.Table6Count +
    reservation.Table8Count;

            var isBookingByTable = requestedTableTypeCount > 0;
            var isBookingByPeople = !isBookingByTable;

            if (isBookingByTable && distinctTableIds.Count != requestedTableTypeCount)
            {
                throw new Exception("Số bàn gán phải bằng số bàn khách đặt trước");
            }

            var selectedTables = await _context.DiningTables
                .Where(t => distinctTableIds.Contains(t.TableId) && t.IsActive)
                .ToListAsync();

            if (selectedTables.Count != distinctTableIds.Count)
            {
                throw new Exception("Có bàn không hợp lệ hoặc đã ngừng hoạt động");
            }

            var totalCapacity = selectedTables.Sum(t => t.Capacity);

            if (totalCapacity < reservation.PartySize)
            {
                throw new Exception("Tổng sức chứa của bàn chưa đủ cho số lượng khách");
            }

            var targetStart = reservation.ReservedAt;
            var targetEnd = GetAssignmentBlockEnd(targetStart);

            var otherReservationOrders = await _context.Orders
                .Include(o => o.OrderTables)
                .Include(o => o.Reservation)
                .Where(o =>
                    o.ReservationId != null &&
                    o.ReservationId != reservationId &&
                    o.Reservation != null &&
                    o.Reservation.Status != "CANCELLED" &&
                    o.Reservation.Status != "COMPLETED" &&
                    o.Reservation.Status != "NO_SHOW")
                .ToListAsync();

            foreach (var table in selectedTables)
            {
                if (table.Status == "OCCUPIED")
                {
                    throw new Exception($"Bàn {table.TableCode} đang có khách");
                }

                var conflictOrder = otherReservationOrders.FirstOrDefault(o =>
                    o.OrderTables.Any(ot => ot.TableId == table.TableId) &&
                    IsOverlapping(
                        targetStart,
                        targetEnd,
                        o.Reservation!.ReservedAt,
                        GetAssignmentBlockEnd(o.Reservation.ReservedAt)
                    )
                );

                if (conflictOrder != null)
                {
                    throw new Exception($"Bàn {table.TableCode} đã được đặt trước");
                }
            }

            var order = await _context.Orders
                .Include(o => o.OrderTables)
                .FirstOrDefaultAsync(o => o.ReservationId == reservationId);

            if (order == null)
            {
                order = new Order
                {
                    ReservationId = reservation.ReservationId,
                    CustomerId = reservation.CustomerId,

                    OrderCode = $"RES-{reservation.ReservationId}-{DateTime.Now:yyyyMMddHHmmss}",

                    Status = "RESERVED",
                    OrderType = "DINE_IN"
                };

                _context.Orders.Add(order);
                await _context.SaveChangesAsync();
            }
            else if (order.OrderTables != null && order.OrderTables.Any())
            {
                throw new Exception("Đơn này đã được gán bàn, không thể thay đổi bàn");
            }

            foreach (var tableId in distinctTableIds)
            {
                _context.OrderTables.Add(new OrderTable
                {
                    OrderId = order.OrderId,
                    TableId = tableId,
                    AssignedAt = DateTime.Now
                });
            }

            if (reservation.Status == "PENDING")
            {
                reservation.Status = "CONFIRMED";
            }

            await _context.SaveChangesAsync();

            return true;
        }
        public async Task<long> CheckInReservationAsync(long reservationId)
        {
            var reservation = await _context.Reservations
                .FirstOrDefaultAsync(r => r.ReservationId == reservationId);

            if (reservation == null)
                throw new Exception("Không tìm thấy đơn đặt bàn");

            if (reservation.Status == "CANCELLED")
                throw new Exception("Không thể check-in đơn đã hủy");

            if (reservation.Status == "CHECKED_IN")
                throw new Exception("Đơn này đã check-in");

            var now = DateTimeHelper.VietnamNow();

            var earliestCheckInTime = reservation.ReservedAt.AddMinutes(-30);

            if (now < earliestCheckInTime)
                throw new Exception("Chỉ được check-in sớm hơn giờ đặt tối đa 30 phút");

            var order = await _context.Orders
                .Include(o => o.OrderTables)
                .Include(o => o.OrderItems)
                .FirstOrDefaultAsync(o => o.ReservationId == reservationId);

            if (order == null || order.OrderTables == null || !order.OrderTables.Any())
                throw new Exception("Vui lòng gán bàn trước khi check-in");

            var tableIds = order.OrderTables.Select(ot => ot.TableId).ToList();

            var tables = await _context.DiningTables
                .Where(t => tableIds.Contains(t.TableId))
                .ToListAsync();

            var unavailableTables = tables
                .Where(t => t.Status != "AVAILABLE")
                .ToList();

            if (unavailableTables.Any())
            {
                reservation.Status = "WAITING";
                await _context.SaveChangesAsync();

                var tableNames = string.Join(", ", unavailableTables.Select(t => t.TableCode));

                throw new Exception($"Bàn đã gán chưa sẵn sàng: {tableNames}. Đơn đã được chuyển sang trạng thái chờ.");
            }

            foreach (var table in tables)
            {
                table.Status = "OCCUPIED";
            }

            order.Status = "OPEN";
            order.OpenedAt = now;

            if (order.OrderItems != null && order.OrderItems.Any())
            {
                foreach (var item in order.OrderItems)
                {
                    item.CreatedAt = now;
                }
            }

            reservation.Status = "CHECKED_IN";

            await _context.SaveChangesAsync();

            try
            {
                var tableNamesStr = string.Join(", ", tables.Select(t => t.TableCode));
                await _notificationService.CreateNotificationAsync(
                    title: "Khách nhận bàn (Check-in)",
                    message: $"Khách hàng {reservation.CustomerName} đã nhận bàn {tableNamesStr}.",
                    type: "CHECKIN",
                    userId: reservation.CustomerId?.ToString(),
                    role: "Staff",
                    relatedId: reservation.ReservationId.ToString()
                );
            }
            catch { }

            return order.OrderId;
        }
    }
}
