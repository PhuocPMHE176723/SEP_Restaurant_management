using System;
using System.Linq;
using System.Threading.Tasks;
using rmn_be.Core.DTOs;
using rmn_be.Core.Services.Interface;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Repositories.Interface;

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

            var readyItems = (
                await orderItemRepo.FindAsync(x =>
                    x.Status == "READY_SERVE" && x.CreatedAt >= today && x.CreatedAt < tomorrow
                )
            ).ToList();

            if (!readyItems.Any())
                return new List<ServingItemDTO>();

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
                    var waitingTableCount = g.Where(x => orders.ContainsKey(x.OrderId))
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
                        WaitingTableCount = waitingTableCount,
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

            var relatedItems = (
                await orderItemRepo.FindAsync(x =>
                    x.ItemId == itemId
                    && x.CreatedAt >= today
                    && x.CreatedAt < tomorrow
                    && x.Status != "CANCELLED"
                )
            ).ToList();

            if (!relatedItems.Any())
                return new List<ServingTableDTO>();

            // Món này phải có ít nhất 1 item READY_SERVE thì mới mở danh sách phục vụ
            var hasAnyReadyServe = relatedItems.Any(x => x.Status == "READY_SERVE");
            if (!hasAnyReadyServe)
                return new List<ServingTableDTO>();

            var orderIds = relatedItems.Select(x => x.OrderId).Distinct().ToList();

            var orders = (await orderRepo.GetAllAsync())
                .Where(x => orderIds.Contains(x.OrderId))
                .ToDictionary(x => x.OrderId, x => x);

            var orderTables = (await orderTableRepo.GetAllAsync())
                .Where(x => orderIds.Contains(x.OrderId))
                .ToList();

            // Collect table ids from join table first; fall back to legacy Order.TableId
            var tableIds = orderTables
                .Select(x => x.TableId)
                .Concat(
                    orders.Values.Where(x => x.TableId.HasValue).Select(x => x.TableId!.Value)
                )
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
                        .Select(ot =>
                            tables.ContainsKey(ot.TableId) ? tables[ot.TableId].TableName : null
                        )
                        .Where(name => !string.IsNullOrWhiteSpace(name))
                        .Distinct()
                        .ToList();

                    // Legacy fallback when order has only one table (older data)
                    if (!tableNames.Any() && order.TableId.HasValue)
                    {
                        if (tables.TryGetValue(order.TableId.Value, out var legacyTable))
                        {
                            tableNames.Add(legacyTable.TableName);
                        }
                    }

                    var tableDisplay = tableNames.Any() ? string.Join(", ", tableNames) : "Mang về";

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
                        OpenedAt = order.OpenedAt,
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
            if (quantity <= 0)
                return false;

            var orderItemRepo = _unitOfWork.GetRepository<OrderItem>();
            var orderRepo = _unitOfWork.GetRepository<Order>();

            var targetOrder = await orderRepo.GetByIdAsync(orderId);
            if (targetOrder == null)
                return false;

            // 1) Prefer serving from READY_SERVE items already in the target order.
            var targetReadyItems = (
                await orderItemRepo.FindAsync(x =>
                    x.ItemId == itemId
                    && x.OrderId == orderId
                    && x.Status == "READY_SERVE"
                )
            )
                .OrderBy(x => x.CreatedAt)
                .ToList();

            if (targetReadyItems.Any())
            {
                var ok = await ServeFromReadyItemsAsync(orderItemRepo, targetReadyItems, quantity);
                if (!ok)
                    return false;

                await _unitOfWork.SaveChangesAsync();
                return true;
            }

            // 2) If the target order has no READY_SERVE yet, but there are READY_SERVE items elsewhere,
            //    we allow "swap" status so serving staff can serve to the intended order.
            var allReadyItems = (
                await orderItemRepo.FindAsync(x => x.ItemId == itemId && x.Status == "READY_SERVE")
            )
                .OrderBy(x => x.CreatedAt)
                .ToList();

            if (!allReadyItems.Any())
                return false;

            var targetItems = (
                await orderItemRepo.FindAsync(x =>
                    x.ItemId == itemId
                    && x.OrderId == orderId
                    && x.Status != "SERVED"
                    && x.Status != "CANCELLED"
                )
            )
                .OrderBy(x => x.CreatedAt)
                .ToList();

            if (!targetItems.Any())
                return false;

            // Target order must have enough ordered quantity to be served.
            var targetAvailableQty = targetItems.Sum(x => x.Quantity);
            if (targetAvailableQty < quantity)
                return false;

            // Pick a source order that has enough READY_SERVE quantity (earliest first).
            var sourceGroup = allReadyItems
                .GroupBy(x => x.OrderId)
                .OrderBy(g => g.Min(x => x.CreatedAt))
                .FirstOrDefault(g => g.Sum(x => x.Quantity) >= quantity);

            if (sourceGroup == null)
                return false;

            var sourceItems = sourceGroup.OrderBy(x => x.CreatedAt).ToList();

            var previousStatus = targetItems.Select(x => x.Status).FirstOrDefault(s => s != "READY_SERVE")
                ?? "COOKING";

            foreach (var item in sourceItems)
            {
                item.Status = previousStatus;
                orderItemRepo.Update(item);
            }

            foreach (var item in targetItems)
            {
                item.Status = "READY_SERVE";
                orderItemRepo.Update(item);
            }

            var okAfterSwap = await ServeFromReadyItemsAsync(orderItemRepo, targetItems, quantity);
            if (!okAfterSwap)
                return false;

            await _unitOfWork.SaveChangesAsync();
            return true;
        }

        private static async Task<bool> ServeFromReadyItemsAsync(
            IGenericRepository<OrderItem> orderItemRepo,
            List<OrderItem> readyItems,
            int quantity
        )
        {
            var remain = quantity;

            foreach (var item in readyItems.OrderBy(x => x.CreatedAt))
            {
                if (remain <= 0)
                    break;

                if (item.Quantity <= remain)
                {
                    item.Status = "SERVED";
                    orderItemRepo.Update(item);
                    remain -= item.Quantity;
                    continue;
                }

                // Partial serve: split into (remaining READY_SERVE) + (new SERVED)
                item.Quantity -= remain;
                orderItemRepo.Update(item);

                await orderItemRepo.AddAsync(
                    new OrderItem
                    {
                        OrderId = item.OrderId,
                        ItemId = item.ItemId,
                        Quantity = remain,
                        UnitPrice = item.UnitPrice,
                        ItemNameSnapshot = item.ItemNameSnapshot,
                        Note = item.Note,
                        Status = "SERVED",
                        CreatedAt = item.CreatedAt,
                    }
                );

                remain = 0;
            }

            return remain == 0;
        }

        public async Task<bool> ReassignReadyItemAsync(
            long itemId,
            long fromOrderId,
            long toOrderId,
            int quantity
        )
        {
            if (quantity <= 0 || fromOrderId == toOrderId)
                return false;

            var orderItemRepo = _unitOfWork.GetRepository<OrderItem>();
            var orderRepo = _unitOfWork.GetRepository<Order>();

            var fromOrder = await orderRepo.GetByIdAsync(fromOrderId);
            var toOrder = await orderRepo.GetByIdAsync(toOrderId);

            if (fromOrder == null || toOrder == null)
                return false;

            var sourceItems = (
                await orderItemRepo.FindAsync(x =>
                    x.ItemId == itemId && x.OrderId == fromOrderId && x.Status == "READY_SERVE"
                )
            )
                .OrderBy(x => x.CreatedAt)
                .ToList();

            if (!sourceItems.Any())
                return false;

            var remain = quantity;

            foreach (var item in sourceItems)
            {
                if (remain <= 0)
                    break;

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
                        CreatedAt = item.CreatedAt,
                    };

                    await orderItemRepo.AddAsync(newTargetItem);
                }

                remain -= moveQty;
            }

            if (remain > 0)
                return false;

            await _unitOfWork.SaveChangesAsync();

            return true;
        }
    }
}
