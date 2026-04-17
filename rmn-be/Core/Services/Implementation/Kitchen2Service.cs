using rmn_be.Core.DTOs;
using rmn_be.Core.Services.Interface;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Repositories.Interface;

namespace rmn_be.Core.Services.Implementation
{
    public class Kitchen2Service : IKitchen2Service
    {
        private readonly IUnitOfWork _unitOfWork;

        public Kitchen2Service(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }


        public async Task<List<CookingListItemDTO>> GetCookingListAsync()
        {
            var orderItemRepo = _unitOfWork.GetRepository<OrderItem>();
            var orderRepo = _unitOfWork.GetRepository<Order>();
            var menuItemRepo = _unitOfWork.GetRepository<MenuItem>();
            var reservationRepo = _unitOfWork.GetRepository<Reservation>();

            var today = DateTime.Today;
            var tomorrow = today.AddDays(1);

            // Chỉ lấy item trong ngày hôm nay và không bị hủy
            var orderItems = (await orderItemRepo.FindAsync(x =>
                    x.Status != "CANCELLED" &&
                    x.CreatedAt >= today &&
                    x.CreatedAt < tomorrow))
                .ToList();

            if (!orderItems.Any()) return new List<CookingListItemDTO>();

            var orderIds = orderItems.Select(x => x.OrderId).Distinct().ToList();
            var itemIds = orderItems.Select(x => x.ItemId).Distinct().ToList();

            var orders = (await orderRepo.GetAllAsync())
                .Where(x => orderIds.Contains(x.OrderId))
                .ToDictionary(x => x.OrderId, x => x);

            var menuItems = (await menuItemRepo.GetAllAsync())
                .Where(x => itemIds.Contains(x.ItemId))
                .ToDictionary(x => x.ItemId, x => x);

            var reservationIds = orders.Values
                .Where(x => x.ReservationId.HasValue)
                .Select(x => x.ReservationId!.Value)
                .Distinct()
                .ToList();

            var reservations = (await reservationRepo.GetAllAsync())
                .Where(x => reservationIds.Contains(x.ReservationId))
                .ToDictionary(x => x.ReservationId, x => x);

            var validOrderItems = orderItems
                .Where(oi => orders.ContainsKey(oi.OrderId) && menuItems.ContainsKey(oi.ItemId))
                .ToList();

            var result = validOrderItems
                .GroupBy(x => x.ItemId)
                .Select(group =>
                {
                    var menuItem = menuItems[group.Key];
                    var relatedItems = group.ToList();

                    int totalPreOrderQuantity = 0;
                    int mustCookQuantity = 0;
                    int cookingQuantity = 0;
                    int readyServeQuantity = 0;

                    foreach (var orderItem in relatedItems)
                    {
                        var order = orders[orderItem.OrderId];

                        bool isPreOrder = order.ReservationId.HasValue;
                        bool isCheckedIn = false;

                        if (isPreOrder &&
                            order.ReservationId.HasValue &&
                            reservations.ContainsKey(order.ReservationId.Value))
                        {
                            var reservation = reservations[order.ReservationId.Value];

                            // Đổi lại nếu project dùng status khác
                            isCheckedIn = reservation.Status == "CHECKED_IN";
                        }

                        // 1. Tổng đặt trước = đơn đặt trước, chưa check-in, pending
                        if (isPreOrder && !isCheckedIn && orderItem.Status == "PENDING")
                        {
                            totalPreOrderQuantity += orderItem.Quantity;
                        }

                        // 2. Cần nấu:
                        // - đơn đặt trước đã check-in + pending
                        // - đơn gọi trực tiếp (không đặt trước) + pending
                        if (
                            orderItem.Status == "PENDING" &&
                            (
                                (isPreOrder && isCheckedIn) ||
                                !isPreOrder
                            )
                        )
                        {
                            mustCookQuantity += orderItem.Quantity;
                        }

                        // 3. Đang nấu
                        if (orderItem.Status == "COOKING")
                        {
                            cookingQuantity += orderItem.Quantity;
                        }

                        // 4. Sẵn sàng phục vụ
                        if (orderItem.Status == "READY_SERVE")
                        {
                            readyServeQuantity += orderItem.Quantity;
                        }
                    }

                    return new CookingListItemDTO
                    {
                        ItemId = menuItem.ItemId,
                        ItemName = menuItem.ItemName,
                        Thumbnail = menuItem.Thumbnail,
                        Unit = menuItem.Unit,
                        TotalPreOrderQuantity = totalPreOrderQuantity,
                        MustCookQuantity = mustCookQuantity,
                        CookingQuantity = cookingQuantity,
                        ReadyServeQuantity = readyServeQuantity
                    };
                })
                .Where(x =>
                    x.TotalPreOrderQuantity > 0 ||
                    x.MustCookQuantity > 0 ||
                    x.CookingQuantity > 0 ||
                    x.ReadyServeQuantity > 0)
                .OrderByDescending(x => x.MustCookQuantity + x.CookingQuantity + x.ReadyServeQuantity)
                .ThenBy(x => x.ItemName)
                .ToList();

            return result;
        }

        public async Task<bool> StartCookingByItemAsync(long itemId)
        {
            var candidate = await GetOldestPendingOrderItemCanCookAsync(itemId);
            if (candidate == null) return false;

            candidate.Status = "COOKING";

            _unitOfWork.GetRepository<OrderItem>().Update(candidate);
            await _unitOfWork.SaveChangesAsync();
            return true;
        }

        public async Task<bool> MarkReadyServeByItemAsync(long itemId)
        {
            var candidate = await GetOldestCookingOrderItemAsync(itemId);
            if (candidate == null) return false;

            candidate.Status = "READY_SERVE";

            _unitOfWork.GetRepository<OrderItem>().Update(candidate);
            await _unitOfWork.SaveChangesAsync();
            return true;
        }

        private async Task<OrderItem?> GetOldestPendingOrderItemCanCookAsync(long itemId)
        {
            var orderItemRepo = _unitOfWork.GetRepository<OrderItem>();
            var orderRepo = _unitOfWork.GetRepository<Order>();
            var reservationRepo = _unitOfWork.GetRepository<Reservation>();

            var today = DateTime.Today;
            var tomorrow = today.AddDays(1);

            var pendingItems = (await orderItemRepo.FindAsync(x =>
                    x.ItemId == itemId &&
                    x.Status == "PENDING" &&
                    x.CreatedAt >= today &&
                    x.CreatedAt < tomorrow))
                .OrderBy(x => x.CreatedAt)
                .ToList();

            if (!pendingItems.Any()) return null;

            var orderIds = pendingItems.Select(x => x.OrderId).Distinct().ToList();

            var orders = (await orderRepo.GetAllAsync())
                .Where(x => orderIds.Contains(x.OrderId))
                .ToDictionary(x => x.OrderId, x => x);

            var reservationIds = orders.Values
                .Where(x => x.ReservationId.HasValue)
                .Select(x => x.ReservationId!.Value)
                .Distinct()
                .ToList();

            var reservations = (await reservationRepo.GetAllAsync())
                .Where(x => reservationIds.Contains(x.ReservationId))
                .ToDictionary(x => x.ReservationId, x => x);

            var candidate = pendingItems
                .Where(oi =>
                {
                    if (!orders.ContainsKey(oi.OrderId)) return false;

                    var order = orders[oi.OrderId];

                    // order trực tiếp -> cho nấu luôn
                    if (!order.ReservationId.HasValue) return true;

                    // order đặt trước -> phải check-in rồi mới nấu
                    if (reservations.ContainsKey(order.ReservationId.Value))
                    {
                        return reservations[order.ReservationId.Value].Status == "CHECKED_IN";
                    }

                    return false;
                })
                .OrderBy(oi => oi.CreatedAt)
                .FirstOrDefault();

            return candidate;
        }

        private async Task<OrderItem?> GetOldestCookingOrderItemAsync(long itemId)
        {
            var orderItemRepo = _unitOfWork.GetRepository<OrderItem>();

            var cookingItems = (await orderItemRepo.FindAsync(x =>
                    x.ItemId == itemId &&
                    x.Status == "COOKING"))
                .OrderBy(x => x.CreatedAt)
                .ToList();

            return cookingItems.FirstOrDefault();
        }
    }
}
