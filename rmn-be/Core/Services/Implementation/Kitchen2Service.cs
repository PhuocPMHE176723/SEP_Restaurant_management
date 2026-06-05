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
        public async Task<List<CookingListItemDTO>> GetCookingListAsync(DateTime? targetDate = null, string shift = "all")
        {
            var orderItemRepo = _unitOfWork.GetRepository<OrderItem>();
            var orderRepo = _unitOfWork.GetRepository<Order>();
            var menuItemRepo = _unitOfWork.GetRepository<MenuItem>();
            var reservationRepo = _unitOfWork.GetRepository<Reservation>();

            var date = targetDate ?? DateTime.Today;

            // 1. Lấy OrderItem (chỉ lọc status)
            var orderItems = (await orderItemRepo.FindAsync(x =>
                    x.Status != "CANCELLED"))
                .ToList();

            if (!orderItems.Any()) return new List<CookingListItemDTO>();

            var orderIds = orderItems.Select(x => x.OrderId).Distinct().ToList();
            var itemIds = orderItems.Select(x => x.ItemId).Distinct().ToList();

            // 2. Load Orders
            var orders = (await orderRepo.GetAllAsync())
                .Where(x => orderIds.Contains(x.OrderId))
                .ToDictionary(x => x.OrderId, x => x);

            // 3. Load MenuItems
            var menuItems = (await menuItemRepo.GetAllAsync())
                .Where(x => itemIds.Contains(x.ItemId))
                .ToDictionary(x => x.ItemId, x => x);

            // 4. Load Reservations
            var reservationIds = orders.Values
                .Where(x => x.ReservationId.HasValue)
                .Select(x => x.ReservationId!.Value)
                .Distinct()
                .ToList();

            var reservations = (await reservationRepo.GetAllAsync())
                .Where(x => reservationIds.Contains(x.ReservationId))
                .ToDictionary(x => x.ReservationId, x => x);

            // 5. FILTER ĐÚNG THEO DATE + SHIFT
            orderItems = orderItems.Where(oi =>
            {
                if (!orders.TryGetValue(oi.OrderId, out var order))
                    return false;

                DateTime referenceTime;

                // PreOrder → dùng Reservation
                if (order.ReservationId.HasValue &&
                    reservations.TryGetValue(order.ReservationId.Value, out var res))
                {
                    referenceTime = res.ReservedAt;
                }
                else
                {
                    // Order thường → dùng Order.CreatedAt
                    referenceTime = order.OpenedAt;
                }

                // Filter theo ngày
                if (referenceTime.Date != date.Date)
                    return false;

                // Filter theo ca
                if (shift == "morning")
                    return referenceTime.Hour >= 1 && referenceTime.Hour < 14;

                if (shift == "afternoon")
                    return referenceTime.Hour >= 14 && referenceTime.Hour < 24;

                return true; // shift = all
            }).ToList();

            if (!orderItems.Any()) return new List<CookingListItemDTO>();

            // 6. GROUP & BUSINESS LOGIC
            var result = orderItems
                .Where(oi => orders.ContainsKey(oi.OrderId) && menuItems.ContainsKey(oi.ItemId))
                .GroupBy(x => x.ItemId)
                .Select(group =>
                {
                    var menuItem = menuItems[group.Key];
                    var relatedItems = group.ToList();

                    var dto = new CookingListItemDTO
                    {
                        ItemId = menuItem.ItemId,
                        ItemName = menuItem.ItemName,
                        Thumbnail = menuItem.Thumbnail,
                        Unit = menuItem.Unit,
                        TotalPreOrderQuantity = 0,
                        MustCookQuantity = 0,
                        CookingQuantity = 0,
                        ReadyServeQuantity = 0,
                        PreOrderDetails = new List<PreOrderSlotDTO>(),
                    };

                    var hourlySlots = new Dictionary<string, int>();

                    foreach (var orderItem in relatedItems)
                    {
                        if (orderItem.MenuItem.ItemType != "PROCESSED") continue;
                        var order = orders[orderItem.OrderId];

                        bool isPreOrder = order.ReservationId.HasValue;
                        bool isCheckedIn = false;
                        DateTime? reservationTime = null;

                        //if (isPreOrder &&
                        //    reservations.TryGetValue(order.ReservationId!.Value, out var res))
                        //{
                        //    isCheckedIn = res.Status == "CHECKED_IN";
                        //    reservationTime = res.ReservedAt;
                        //}

                        //// A. PreOrder chưa check-in
                        //if (isPreOrder && !isCheckedIn && orderItem.Status == "PENDING")
                        //{
                        //    dto.TotalPreOrderQuantity += orderItem.Quantity;

                        //    var timeKey = reservationTime?.ToString("HH:mm") ?? "N/A";

                        //    if (hourlySlots.ContainsKey(timeKey))
                        //        hourlySlots[timeKey] += orderItem.Quantity;
                        //    else
                        //        hourlySlots[timeKey] = orderItem.Quantity;
                        //}
                        if (isPreOrder &&
                            reservations.TryGetValue(order.ReservationId!.Value, out var res))
                        {
                            isCheckedIn = res.Status == "CHECKED_IN";
                            reservationTime = res.ReservedAt;
                        }

                        // --- A. XỬ LÝ SỐ LIỆU ĐẶT TRƯỚC (PRE-ORDER) ---
                        if (isPreOrder)
                        {
                            // Cộng dồn vào Mẫu số đặt trước (24) - Tổng số lượng trong tất cả reservation
                            dto.TotalPreOrderQuantity += orderItem.Quantity;

                            // Cộng dồn vào Tử số đặt trước (7) - Số lượng trong reservation ĐÃ CHECK-IN
                            if (isCheckedIn)
                            {
                                dto.CheckedInPreOrderQuantity += orderItem.Quantity;
                            }
                        }

                        // B. Cần nấu
                        if (orderItem.Status == "PENDING" &&
                            ((isPreOrder && isCheckedIn) || !isPreOrder))
                        {
                            dto.MustCookQuantity += orderItem.Quantity;
                        }

                        // C. Đang nấu
                        if (orderItem.Status == "COOKING")
                        {
                            dto.CookingQuantity += orderItem.Quantity;
                        }

                        // D. Sẵn sàng
                        if (orderItem.Status == "READY_SERVE")
                        {
                            dto.ReadyServeQuantity += orderItem.Quantity;
                        }
                    }
                    // Map dropdown giờ
                    dto.PreOrderDetails = hourlySlots
                        .OrderBy(x => x.Key)
                        .Select(x => new PreOrderSlotDTO
                        {
                            Time = x.Key,
                            Quantity = x.Value
                        })
                        .ToList();

                    return dto;
                })
                .Where(x => x.TotalPreOrderQuantity > 0
                         || x.MustCookQuantity > 0
                         || x.CookingQuantity > 0
                         || x.ReadyServeQuantity > 0)
                .OrderByDescending(x => x.MustCookQuantity)
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
            var candidate = await GetOldestPendingOrderItemCanCookAsync(itemId);

            if (candidate == null)
                return false;

            await SplitOneToReadyAsync(candidate);

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

        private async Task SplitOneToReadyAsync(OrderItem pendingItem)
        {
            var repo = _unitOfWork.GetRepository<OrderItem>();

            // tìm READY_SERVE cùng món trong cùng order
            var readyItem = (await repo.FindAsync(x =>
                x.OrderId == pendingItem.OrderId &&
                x.ItemId == pendingItem.ItemId &&
                x.Status == "READY_SERVE"))
                .FirstOrDefault();

            // giảm pending
            pendingItem.Quantity -= 1;

            if (readyItem != null)
            {
                // đã có READY rồi -> tăng quantity
                readyItem.Quantity += 1;

                repo.Update(readyItem);
            }
            else
            {
                // chưa có -> tạo record mới
                var newReady = new OrderItem
                {
                    OrderId = pendingItem.OrderId,
                    ItemId = pendingItem.ItemId,
                    Quantity = 1,
                    Status = "READY_SERVE",
                    ItemNameSnapshot = pendingItem.ItemNameSnapshot,
                    UnitPrice = pendingItem.UnitPrice,
                    CreatedAt = pendingItem.CreatedAt,

                };

                await repo.AddAsync(newReady);
            }

            if (pendingItem.Quantity == 0)
            {
                repo.Delete(pendingItem);
            }
            else
            {
                repo.Update(pendingItem);
            }

            await _unitOfWork.SaveChangesAsync();
        }


    }
}
