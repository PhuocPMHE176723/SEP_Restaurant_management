using Microsoft.EntityFrameworkCore.Metadata.Internal;
using rmn_be.Core.DTOs;
using rmn_be.Core.Services.Interface;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Repositories.Interface;
using System.Linq;

namespace rmn_be.Core.Services.Implementation
{
    public class ServingService : IServingService
    {
        private readonly IUnitOfWork _unitOfWork;

        public ServingService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
           
        }

        public async Task<List<ServingItemDTO>> GetServingListAsync()
        {
            var orderItemRepo = _unitOfWork.GetRepository<OrderItem>();
            var menuItemRepo = _unitOfWork.GetRepository<MenuItem>();
            var orderRepo = _unitOfWork.GetRepository<Order>();

            var today = DateTime.Today;
            var tomorrow = today.AddDays(1);

            var readyItems = (await orderItemRepo.FindAsync(x =>
                    x.Status == "READY_SERVE" &&
                    x.CreatedAt >= today &&
                    x.CreatedAt < tomorrow))
                .ToList();

            if (!readyItems.Any()) return new List<ServingItemDTO>();

            var itemIds = readyItems.Select(x => x.ItemId).Distinct().ToList();
            var orderIds = readyItems.Select(x => x.OrderId).Distinct().ToList();

            var menuItems = (await menuItemRepo.GetAllAsync())
                .Where(x => itemIds.Contains(x.ItemId))
                .ToDictionary(x => x.ItemId, x => x);

            var orders = (await orderRepo.GetAllAsync())
                .Where(x => orderIds.Contains(x.OrderId))
                .ToDictionary(x => x.OrderId, x => x);

            var result = readyItems
                .Where(x => menuItems.ContainsKey(x.ItemId))
                .GroupBy(x => x.ItemId)
                .Select(g =>
                {
                    var menuItem = menuItems[g.Key];
                    var waitingTableCount = g
                        .Where(x => orders.ContainsKey(x.OrderId))
                        .Select(x => x.OrderId)
                        .Distinct()
                        .Count();

                    return new ServingItemDTO
                    {
                        ItemId = menuItem.ItemId,
                        ItemName = menuItem.ItemName,
                        Thumbnail = menuItem.Thumbnail,
                        Unit = menuItem.Unit,
                        ReadyQuantity = g.Sum(x => x.Quantity),
                        WaitingTableCount = waitingTableCount
                    };
                })
                .OrderByDescending(x => x.ReadyQuantity)
                .ThenBy(x => x.ItemName)
                .ToList();

            return result;
        }

        public async Task<List<ServingTableDTO>> GetServingTablesAsync(long itemId)
        {
            var orderItemRepo = _unitOfWork.GetRepository<OrderItem>();
            var orderRepo = _unitOfWork.GetRepository<Order>();
            var tableRepo = _unitOfWork.GetRepository<DiningTable>();

            var today = DateTime.Today;
            var tomorrow = today.AddDays(1);

            var relatedItems = (await orderItemRepo.FindAsync(x =>
                    x.ItemId == itemId &&
                    x.CreatedAt >= today &&
                    x.CreatedAt < tomorrow &&
                    x.Status != "CANCELLED"))
                .ToList();

            if (!relatedItems.Any()) return new List<ServingTableDTO>();

            // Món này phải có ít nhất 1 item READY_SERVE thì mới mở danh sách phục vụ
            var hasAnyReadyServe = relatedItems.Any(x => x.Status == "READY_SERVE");
            if (!hasAnyReadyServe) return new List<ServingTableDTO>();

            var orderIds = relatedItems.Select(x => x.OrderId).Distinct().ToList();

            var orders = (await orderRepo.GetAllAsync())
                .Where(x => orderIds.Contains(x.OrderId))
                .ToDictionary(x => x.OrderId, x => x);

            var tableIds = orders.Values
                .Where(x => x.TableId.HasValue)
                .Select(x => x.TableId!.Value)
                .Distinct()
                .ToList();

            var tables = (await tableRepo.GetAllAsync())
                .Where(x => tableIds.Contains(x.TableId))
                .ToDictionary(x => x.TableId, x => x);

            var result = relatedItems
                .Where(x => orders.ContainsKey(x.OrderId))
                .GroupBy(x => x.OrderId)
                .Select(g =>
                {
                    var order = orders[g.Key];

                    var orderedQuantity = g.Sum(x => x.Quantity);
                    var readyQty = g.Where(x => x.Status == "READY_SERVE").Sum(x => x.Quantity);
                    var servedQty = g.Where(x => x.Status == "SERVED").Sum(x => x.Quantity);

                    var tableName = order.TableId.HasValue && tables.ContainsKey(order.TableId.Value)
                        ? tables[order.TableId.Value].TableName
                        : "Mang về";

                    var orderCode = !string.IsNullOrWhiteSpace(order.OrderCode)
                        ? order.OrderCode
                        : $"ORD{order.OrderId}";

                    return new ServingTableDTO
                    {
                        OrderId = order.OrderId,
                        OrderCode = orderCode,
                        TableNames = tableName,
                        DisplayLabel = $"{orderCode} - {tableName}",
                        OrderedQuantity = orderedQuantity,
                        ReadyQuantity = readyQty,
                        ServedQuantity = servedQty,
                        Priority = readyQty > 0,
                        OpenedAt = order.OpenedAt
                    };
                })
                // Nếu order đã phục vụ hết món này thì không hiện nữa
                .Where(x => x.OrderedQuantity > x.ServedQuantity)
                // Order nào đang có READY_SERVE thì lên đầu
                .OrderByDescending(x => x.Priority)
                .ThenBy(x => x.OpenedAt)
                .ThenBy(x => x.DisplayLabel)
                .ToList();

            return result;
        }

        public async Task<bool> ServeReadyItemAsync(long itemId, long orderId, int quantity)
        {
            if (quantity <= 0) return false;

            var orderItemRepo = _unitOfWork.GetRepository<OrderItem>();
            var orderRepo = _unitOfWork.GetRepository<Order>();

            var targetOrder = await orderRepo.GetByIdAsync(orderId);
            if (targetOrder == null) return false;

            // B1: thử lấy READY_SERVE ngay trong order đích trước
            var targetReadyItems = (await orderItemRepo.FindAsync(x =>
                    x.ItemId == itemId &&
                    x.OrderId == orderId &&
                    x.Status == "READY_SERVE"))
                .OrderBy(x => x.CreatedAt)
                .ToList();

            var remain = quantity;

            // Serve trực tiếp từ order đích nếu có
            foreach (var item in targetReadyItems)
            {
                if (remain <= 0) break;

                if (item.Quantity <= remain)
                {
                    item.Status = "SERVED";
                    orderItemRepo.Update(item);
                    remain -= item.Quantity;
                }
                else
                {
                    item.Quantity -= remain;
                    orderItemRepo.Update(item);

                    var servedItem = new OrderItem
                    {
                        OrderId = item.OrderId,
                        ItemId = item.ItemId,
                        Quantity = remain,
                        UnitPrice = item.UnitPrice,
                        ItemNameSnapshot = item.ItemNameSnapshot,
                        Note = item.Note,
                        Status = "SERVED",
                        CreatedAt = item.CreatedAt
                    };

                    await orderItemRepo.AddAsync(servedItem);
                    remain = 0;
                }
            }

            // B2: nếu order đích chưa có READY_SERVE thì lấy từ order khác
            if (remain > 0)
            {
                var availableReadyItems = (await orderItemRepo.FindAsync(x =>
                        x.ItemId == itemId &&
                        x.Status == "READY_SERVE"))
                    .OrderBy(x => x.CreatedAt)
                    .ToList();

                foreach (var sourceItem in availableReadyItems)
                {
                    if (remain <= 0) break;

                    var moveQty = Math.Min(sourceItem.Quantity, remain);

                    if (moveQty == sourceItem.Quantity)
                    {
                        // chuyển hẳn phần READY_SERVE này sang order đích rồi serve
                        sourceItem.OrderId = orderId;
                        sourceItem.Status = "SERVED";
                        orderItemRepo.Update(sourceItem);
                    }
                    else
                    {
                        sourceItem.Quantity -= moveQty;
                        orderItemRepo.Update(sourceItem);

                        var servedItem = new OrderItem
                        {
                            OrderId = orderId,
                            ItemId = sourceItem.ItemId,
                            Quantity = moveQty,
                            UnitPrice = sourceItem.UnitPrice,
                            ItemNameSnapshot = sourceItem.ItemNameSnapshot,
                            Note = sourceItem.Note,
                            Status = "SERVED",
                            CreatedAt = sourceItem.CreatedAt
                        };

                        await orderItemRepo.AddAsync(servedItem);
                    }

                    remain -= moveQty;
                }
            }

            if (remain > 0) return false;

            await _unitOfWork.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ReassignReadyItemAsync(long itemId, long fromOrderId, long toOrderId, int quantity)
        {
            if (quantity <= 0 || fromOrderId == toOrderId) return false;

            var orderItemRepo = _unitOfWork.GetRepository<OrderItem>();
            var orderRepo = _unitOfWork.GetRepository<Order>();

            var fromOrder = await orderRepo.GetByIdAsync(fromOrderId);
            var toOrder = await orderRepo.GetByIdAsync(toOrderId);

            if (fromOrder == null || toOrder == null) return false;

            var sourceItems = (await orderItemRepo.FindAsync(x =>
                    x.ItemId == itemId &&
                    x.OrderId == fromOrderId &&
                    x.Status == "READY_SERVE"))
                .OrderBy(x => x.CreatedAt)
                .ToList();

            if (!sourceItems.Any()) return false;

            var remain = quantity;

            foreach (var item in sourceItems)
            {
                if (remain <= 0) break;

                var moveQty = Math.Min(item.Quantity, remain);

                if (moveQty == item.Quantity)
                {
                    item.OrderId = toOrderId;
                    orderItemRepo.Update(item);
                }
                else
                {
                    item.Quantity -= moveQty;
                    orderItemRepo.Update(item);

                    var newTargetItem = new OrderItem
                    {
                        OrderId = toOrderId,
                        ItemId = item.ItemId,
                        Quantity = moveQty,
                        ItemNameSnapshot = item.ItemNameSnapshot,
                        Note = item.Note,
                        Status = "READY_SERVE",
                        CreatedAt = item.CreatedAt
                    };

                    await orderItemRepo.AddAsync(newTargetItem);
                }

                remain -= moveQty;
            }

            if (remain > 0) return false;

            await _unitOfWork.SaveChangesAsync();

            return true;
        }
    }
}
