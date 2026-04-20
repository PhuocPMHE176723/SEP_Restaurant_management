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
            var orderTableRepo = _unitOfWork.GetRepository<OrderTable>();

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

            var orderTables = (await orderTableRepo.GetAllAsync())
        .Where(x => orderIds.Contains(x.OrderId))
        .ToList();

            var tableIds = orderTables
                .Select(x => x.TableId)
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

                    var tableNames = orderTables
               .Where(ot => ot.OrderId == g.Key)
               .Select(ot => tables.ContainsKey(ot.TableId) ? tables[ot.TableId].TableName : null)
               .Where(name => !string.IsNullOrEmpty(name))
               .ToList();

                    var tableDisplay = tableNames.Any()
                ? string.Join(", ", tableNames)
                : "Mang về";


                    var orderCode = !string.IsNullOrWhiteSpace(order.OrderCode)
                        ? order.OrderCode
                        : $"ORD{order.OrderId}";

                    return new ServingTableDTO
                    {
                        OrderId = order.OrderId,
                        OrderCode = orderCode,
                        TableNames = tableDisplay,
                        DisplayLabel = $"{orderCode} - {tableDisplay}",
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

            var repo = _unitOfWork.GetRepository<OrderItem>();
            var orderRepo = _unitOfWork.GetRepository<Order>();

            var targetOrder = await orderRepo.GetByIdAsync(orderId);
            if (targetOrder == null) return false;

            //  lấy tất cả item đang READY_SERVE (source)
            var sourceItems = (await repo.FindAsync(x =>
                    x.ItemId == itemId &&
                    x.Status == "READY_SERVE"))
                .OrderBy(x => x.CreatedAt)
                .ToList();

            if (!sourceItems.Any()) return false;

            var sourceOrderId = sourceItems.First().OrderId;

            // ============================================
            //  Serve đúng order đang READY_SERVE
            // ============================================
            if (sourceOrderId == orderId)
            {
                var remain = quantity;

                var targetReadyItems = sourceItems
                    .Where(x => x.OrderId == orderId)
                    .ToList();

                foreach (var item in targetReadyItems)
                {
                    if (remain <= 0) break;

                    if (item.Quantity <= remain)
                    {
                        item.Status = "SERVED";
                        repo.Update(item);
                        remain -= item.Quantity;
                    }
                    else
                    {
                        item.Quantity -= remain;
                        repo.Update(item);

                        await repo.AddAsync(new OrderItem
                        {
                            OrderId = orderId,
                            ItemId = item.ItemId,
                            Quantity = remain,
                            UnitPrice = item.UnitPrice,
                            ItemNameSnapshot = item.ItemNameSnapshot,
                            Note = item.Note,
                            Status = "SERVED",
                            CreatedAt = DateTime.Now
                        });

                        remain = 0;
                    }
                }

                if (remain > 0) return false;

                await _unitOfWork.SaveChangesAsync();
                return true;
            }

            // ============================================
            //  Swap + Serve
            // ============================================

            // target items (order được chọn)
            var targetItems = (await repo.FindAsync(x =>
                    x.ItemId == itemId &&
                    x.OrderId == orderId &&
                    x.Status != "SERVED"))
                .OrderBy(x => x.CreatedAt)
                .ToList();
            var PreviousStatus = targetItems
    .Select(x => x.Status)
    .FirstOrDefault(x => x != "READY_SERVE") ?? "IN_PROGRESS";
            if (!targetItems.Any()) return false;

            //  swap source → PreviousStatus
            foreach (var item in sourceItems)
            {
                var prev = PreviousStatus ?? "COOKING"; // fallback nếu null

                PreviousStatus = item.Status; // READY_SERVE
                item.Status = prev;

                repo.Update(item);
            }

            //  target → READY_SERVE
            foreach (var item in targetItems)
            {
                var current = item.Status;

                PreviousStatus = current;
                item.Status = "READY_SERVE";

                repo.Update(item);
            }

            //  serve từ target
            var remainAfterSwap = quantity;

            foreach (var item in targetItems.Where(x => x.Status == "READY_SERVE"))
            {
                if (remainAfterSwap <= 0) break;

                if (item.Quantity <= remainAfterSwap)
                {
                    item.Status = "SERVED";
                    repo.Update(item);
                    remainAfterSwap -= item.Quantity;
                }
                else
                {
                    item.Quantity -= remainAfterSwap;
                    repo.Update(item);

                    await repo.AddAsync(new OrderItem
                    {
                        OrderId = orderId,
                        ItemId = item.ItemId,
                        Quantity = remainAfterSwap,
                        UnitPrice = item.UnitPrice,
                        ItemNameSnapshot = item.ItemNameSnapshot,
                        Note = item.Note,
                        Status = "SERVED",
                        CreatedAt = DateTime.Now
                    });

                    remainAfterSwap = 0;
                }
            }

            if (remainAfterSwap > 0) return false;

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
