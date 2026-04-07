using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEP_Restaurant_management.Core.Data;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Exceptions;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Middlewares;
using Microsoft.AspNetCore.Identity;
using System.Security.Claims;

namespace SEP_Restaurant_management.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrderController : BaseController
{
    private readonly SepDatabaseContext _context;

    public OrderController(SepDatabaseContext context)
    {
        _context = context;
    }

    [HttpGet]
    [Authorize(Roles = "Staff,Manager,Admin,Kitchen,Receptionist,Cashier")]
    public async Task<IActionResult> GetAllOrders([FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null)
    {
        var query = _context.Orders
            .Include(o => o.Table)
            .Include(o => o.Reservation)
            .Include(o => o.Customer)
            .Include(o => o.OrderItems)
            .AsQueryable();

        if (startDate.HasValue)
        {
            var start = startDate.Value.Date;
            query = query.Where(o => o.OpenedAt >= start);
        }

        if (endDate.HasValue)
        {
            var end = endDate.Value.Date.AddDays(1).AddTicks(-1);
            query = query.Where(o => o.OpenedAt <= end);
        }

        var orders = await query
            .OrderByDescending(o => o.OpenedAt)
            .Select(o => new OrderDTO
            {
                OrderId = o.OrderId,
                OrderCode = o.OrderCode,
                Status = o.Status,
                TableId = o.TableId,
                TableName = o.Table != null ? o.Table.TableCode : null,
                OrderType = o.OrderType,
                CustomerName = o.Customer != null ? o.Customer.FullName : null,
                OpenedAt = o.OpenedAt,
                ClosedAt = o.ClosedAt,
                TotalAmount = o.OrderItems.Sum(oi => oi.Quantity * oi.UnitPrice),
                OrderItems = o
                    .OrderItems.Select(oi => new OrderItemDTO
                    {
                        OrderItemId = oi.OrderItemId,
                        ItemNameSnapshot = oi.ItemNameSnapshot,
                        Quantity = oi.Quantity,
                        UnitPrice = oi.UnitPrice,
                        Status = oi.Status,
                        Note = oi.Note,
                    })
                    .ToList(),
            })
            .ToListAsync();

        return Success(orders);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Staff,Manager,Admin,Kitchen,Receptionist,Cashier")]
    public async Task<IActionResult> GetOrder(long id)
    {
        var order = await _context
            .Orders.Include(o => o.Table)
            .Include(o => o.Reservation)
            .Include(o => o.Customer)
            .Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.OrderId == id);

        if (order == null)
        {
            return NotFoundResponse("Order not found");
        }

        var orderDto = new OrderDTO
        {
            OrderId = order.OrderId,
            OrderCode = order.OrderCode,
            Status = order.Status,
            TableId = order.TableId,
            TableName = order.Table?.TableCode,
            OrderType = order.OrderType,
            CustomerName = order.Customer?.FullName,
            OpenedAt = order.OpenedAt,
            ClosedAt = order.ClosedAt,
            TotalAmount = order.OrderItems.Sum(oi => oi.Quantity * oi.UnitPrice),
            OrderItems = order
                .OrderItems.Select(oi => new OrderItemDTO
                {
                    OrderItemId = oi.OrderItemId,
                    ItemNameSnapshot = oi.ItemNameSnapshot,
                    Quantity = oi.Quantity,
                    UnitPrice = oi.UnitPrice,
                    Status = oi.Status,
                    Note = oi.Note,
                })
                .ToList(),
        };

        return Success(orderDto);
    }

    [HttpPatch("{id}/status")]
    [Authorize(Roles = "Staff,Manager,Admin,Kitchen,Receptionist,Cashier")]
    public async Task<IActionResult> UpdateOrderStatus(
        long id,
        UpdateOrderStatusRequest request
    )
    {
        var order = await _context.Orders.FindAsync(id);
        if (order == null)
        {
            return NotFoundResponse("Order not found");
        }

        var validStatuses = new[] { "OPEN", "SENT_TO_KITCHEN", "SERVED", "CANCELLED", "CLOSED" };
        if (!validStatuses.Contains(request.Status))
        {
            return Failure("Invalid status");
        }

        order.Status = request.Status;

        if (request.Status == "CLOSED" || request.Status == "CANCELLED")
        {
            if (request.Status == "CLOSED")
            {
                order.ClosedAt = DateTimeHelper.VietnamNow();
            }
            
            // 1. Release Primary Table
            if (order.TableId.HasValue)
            {
                var primaryTable = await _context.DiningTables.FindAsync(order.TableId.Value);
                if (primaryTable != null) primaryTable.Status = "AVAILABLE";
            }

            // 2. Release Extra Tables from Note
            if (!string.IsNullOrEmpty(order.Note) && order.Note.StartsWith("[Tables:"))
            {
                var endBracketIndex = order.Note.IndexOf(']');
                if (endBracketIndex > 8)
                {
                    var tableIdsStr = order.Note.Substring(8, endBracketIndex - 8);
                    var tableIds = tableIdsStr.Split(',')
                        .Select(s => int.TryParse(s, out var id) ? id : (int?)null)
                        .Where(id => id.HasValue)
                        .Select(id => id!.Value)
                        .ToList();

                    var extraTables = await _context.DiningTables
                        .Where(t => tableIds.Contains(t.TableId))
                        .ToListAsync();

                    foreach (var table in extraTables)
                    {
                        table.Status = "AVAILABLE";
                    }
                }
            }
        }

        await _context.SaveChangesAsync();

        return Success("Order status updated successfully");
    }

    [HttpPost("{id}/items")]
    [Authorize(Roles = "Staff,Manager,Admin,Receptionist,Cashier")]
    public async Task<IActionResult> AddOrderItem(long id, AddOrderItemRequest request)
    {
        var order = await _context.Orders.FindAsync(id);
        if (order == null)
        {
            return NotFoundResponse("Order not found");
        }

        if (order.Status == "CLOSED" || order.Status == "CANCELLED")
        {
            return Failure("Cannot add items to a closed or cancelled order");
        }

        var menuItem = await _context.MenuItems.FindAsync(request.MenuItemId);
        if (menuItem == null)
        {
            return NotFoundResponse("Menu item not found");
        }

        var orderItem = new OrderItem
        {
            OrderId = id,
            ItemId = request.MenuItemId,
            Quantity = request.Quantity,
            UnitPrice = menuItem.BasePrice,
            ItemNameSnapshot = menuItem.ItemName,
            Note = request.Note,
            Status = "PENDING",
            CreatedAt = DateTimeHelper.VietnamNow(),
        };

        _context.OrderItems.Add(orderItem);
        await _context.SaveChangesAsync();

        return Success("Item added to order successfully");
    }

    [HttpPost("walkin")]
    [Authorize(Roles = "Staff,Receptionist,Manager,Admin,Cashier")]
    public async Task<IActionResult> CreateWalkinOrder(CreateWalkinOrderRequest request)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // 1. Get or Create Customer
            var customer = await _context.Customers
                .FirstOrDefaultAsync(c => c.Phone == request.Phone);

            if (customer == null)
            {
                customer = new Customer
                {
                    FullName = request.Name,
                    Phone = request.Phone,
                    CreatedAt = DateTimeHelper.VietnamNow()
                };
                _context.Customers.Add(customer);
                await _context.SaveChangesAsync();
            }

            // 2. Validate All Tables
            var tables = await _context.DiningTables
                .Where(t => request.TableIds.Contains(t.TableId))
                .ToListAsync();

            if (tables.Count != request.TableIds.Count) return NotFoundResponse("Some tables not found");
            if (tables.Any(t => t.Status != "AVAILABLE")) return Failure("Some tables are not available");

            // 3. Get Staff ID
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var staff = await _context.Staffs.FirstOrDefaultAsync(s => s.UserId == userId);
            
            // 4. Track Tables for release (Store IDs in Note)
            var tableIdsStr = string.Join(",", request.TableIds);
            var noteWithTables = $"[Tables:{tableIdsStr}] " + (request.Note ?? "");
            
            // 5. Create Order (Link to the first/primary table)
            var orderCode = $"WALK-{DateTimeHelper.VietnamNow():yyyyMMdd}-{Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper()}";
            var order = new Order
            {
                OrderCode = orderCode,
                TableId = request.TableIds[0],
                CustomerId = customer.CustomerId,
                OrderType = "DINE_IN",
                Status = "OPEN",
                OpenedAt = DateTimeHelper.VietnamNow(),
                CreatedByStaffId = staff?.StaffId,
                Note = noteWithTables
            };

            _context.Orders.Add(order);

            // 6. Update ALL Table Statuses to OCCUPIED
            foreach (var table in tables)
            {
                table.Status = "OCCUPIED";
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Success(new { order.OrderId, order.OrderCode }, "Walk-in order created successfully");
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return Failure($"Failed to create walk-in order: {ex.Message}");
        }
    }

    [HttpPost("transfer")]
    [Authorize(Roles = "Staff,Receptionist,Manager,Admin,Cashier")]
    public async Task<IActionResult> TransferTable(TransferTableRequest request)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            // 1. Get source table and its active order
            var fromTable = await _context.DiningTables.FindAsync(request.FromTableId);
            if (fromTable == null) return NotFoundResponse("Source table not found");

            var order = await _context.Orders
                .FirstOrDefaultAsync(o => o.TableId == request.FromTableId && 
                                         (o.Status == "OPEN" || o.Status == "SENT_TO_KITCHEN" || o.Status == "SERVED"));
            
            if (order == null) return Failure("No active order found on source table");

            // 2. Get destination table
            var toTable = await _context.DiningTables.FindAsync(request.ToTableId);
            if (toTable == null) return NotFoundResponse("Destination table not found");
            if (toTable.Status != "AVAILABLE") return Failure("Destination table is not available");

            // 3. Update Order
            order.TableId = request.ToTableId;
            order.Note = string.IsNullOrEmpty(order.Note) 
                ? $"Transferred from {fromTable.TableCode}. Reason: {request.Reason}" 
                : $"{order.Note} | Transferred from {fromTable.TableCode}. Reason: {request.Reason}";

            // 4. Update Tables Status
            fromTable.Status = "AVAILABLE";
            toTable.Status = "OCCUPIED";

            // 5. Add status history entry
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var staff = await _context.Staffs.FirstOrDefaultAsync(s => s.UserId == userId);
            
            var history = new OrderStatusHistory
            {
                OrderId = order.OrderId,
                OldStatus = order.Status,
                NewStatus = order.Status, // Status doesn't change, but we log the transfer
                ChangedByStaffId = staff?.StaffId,
                ChangedAt = DateTimeHelper.VietnamNow(),
                Note = $"Table transfer from {fromTable.TableCode} to {toTable.TableCode}. Reason: {request.Reason}"
            };
            _context.OrderStatusHistories.Add(history);

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Success(new { order.OrderId, order.OrderCode }, "Table transferred successfully");
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return Failure($"Failed to transfer table: {ex.Message}");
        }
    }
    [HttpPatch("items/{orderItemId}/status")]
    [Authorize(Roles = "Staff,Manager,Admin,Kitchen,Cashier")]
    public async Task<IActionResult> UpdateOrderItemStatus(
        long orderItemId,
        UpdateOrderStatusRequest request
    )
    {
        var orderItem = await _context.OrderItems
            .Include(oi => oi.Order)
            .FirstOrDefaultAsync(oi => oi.OrderItemId == orderItemId);

        if (orderItem == null)
        {
            return NotFoundResponse("Order item not found");
        }

        var validStatuses = new[] { "PENDING", "COOKING", "SERVED", "CANCELLED" };
        if (!validStatuses.Contains(request.Status))
        {
            return Failure("Invalid status");
        }

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        var staff = await _context.Staffs.FirstOrDefaultAsync(s => s.UserId == userId);

        orderItem.Status = request.Status;
        
        // 1. Tự động trừ kho và cập nhật định lượng ngày nếu món ăn được phục vụ (SERVED)
        if (request.Status == "SERVED")
        {
            var ingredients = await _context.MenuItemIngredients
                .Where(mi => mi.ItemId == orderItem.ItemId)
                .ToListAsync();

            var today = DateTimeHelper.VietnamNow().Date;

            foreach (var ing in ingredients)
            {
                // A. Cập nhật Định lượng Ngày (Daily Allocation)
                var dailyAllocation = await _context.DailyIngredientAllocations
                    .FirstOrDefaultAsync(da => da.IngredientId == ing.IngredientId && da.Date == today);

                if (dailyAllocation != null)
                {
                    dailyAllocation.ActuallyUsedQuantity += ing.Quantity * orderItem.Quantity;
                }

                // B. Ghi nhận biến động kho tổng (Stock Movement)
                var movement = new StockMovement
                {
                    IngredientId = ing.IngredientId,
                    MovementType = "OUT",
                    Quantity = ing.Quantity * orderItem.Quantity,
                    RefType = "ORDER_ITEM",
                    RefId = orderItem.OrderItemId,
                    MovedAt = DateTimeHelper.VietnamNow(),
                    CreatedByStaffId = staff?.StaffId,
                    Note = $"Xuất kho tự động cho món {orderItem.ItemNameSnapshot} (Đơn hàng {orderItem.Order?.OrderCode})"
                };
                _context.StockMovements.Add(movement);
            }
        }

        // 2. Cập nhật lịch sử trạng thái
        var history = new OrderStatusHistory
        {
            OrderId = orderItem.OrderId,
            OldStatus = $"ITEM:{orderItem.ItemNameSnapshot}",
            NewStatus = request.Status,
            ChangedByStaffId = staff?.StaffId,
            ChangedAt = DateTimeHelper.VietnamNow(),
            Note = $"Updated item status to {request.Status}"
        };
        _context.OrderStatusHistories.Add(history);

        await _context.SaveChangesAsync();

        return Success("Order item status updated successfully");
    }

    [HttpPost("guest-add-items")]
    [AllowAnonymous]
    public async Task<IActionResult> GuestAddItems([FromBody] GuestAddItemsRequest request)
    {
        var table = await _context.DiningTables.FindAsync(request.TableId);
        if (table == null || table.Status != "OCCUPIED") return Failure("Bàn không ở trạng thái đang sử dụng");

        var order = await _context.Orders
            .FirstOrDefaultAsync(o => o.TableId == request.TableId && (o.Status == "OPEN" || o.Status == "SENT_TO_KITCHEN" || o.Status == "SERVED"));
        
        if (order == null) return Failure("Không tìm thấy đơn hàng đang hoạt động cho bàn này");

        foreach (var item in request.Items)
        {
            var menuItem = await _context.MenuItems.FindAsync(item.MenuItemId);
            if (menuItem == null) continue;

            var orderItem = new OrderItem
            {
                OrderId = order.OrderId,
                ItemId = item.MenuItemId,
                Quantity = item.Quantity,
                UnitPrice = menuItem.BasePrice,
                ItemNameSnapshot = menuItem.ItemName,
                Note = item.Note,
                Status = "WAIT_CONFIRM",
                CreatedAt = DateTimeHelper.VietnamNow()
            };
            _context.OrderItems.Add(orderItem);
        }

        await _context.SaveChangesAsync();
        return Success("Yêu cầu chọn món đã được gửi. Vui lòng đợi nhân viên xác nhận.");
    }

    [HttpPost("{id}/confirm-items")]
    [Authorize(Roles = "Staff,Manager,Admin,Receptionist,Cashier")]
    public async Task<IActionResult> ConfirmGuestItems(long id, [FromBody] ConfirmItemsRequest request)
    {
        var order = await _context.Orders.FindAsync(id);
        if (order == null || order.Status == "CLOSED" || order.Status == "CANCELLED")
        {
            return Failure("Cannot confirm items for a closed or cancelled order");
        }

        var orderItems = await _context.OrderItems
            .Where(oi => oi.OrderId == id && request.OrderItemIds.Contains(oi.OrderItemId) && oi.Status == "WAIT_CONFIRM")
            .ToListAsync();

        if (orderItems.Count == 0) return Failure("Không có món nào cần xác nhận");

        foreach (var item in orderItems)
        {
            item.Status = "PENDING";
            _context.OrderStatusHistories.Add(new OrderStatusHistory
            {
                OrderId = id,
                OldStatus = "WAIT_CONFIRM",
                NewStatus = "PENDING",
                ChangedAt = DateTimeHelper.VietnamNow(),
                Note = "Staff confirmed guest selection"
            });
        }

        await _context.SaveChangesAsync();
        return Success($"Đã xác nhận {orderItems.Count} món và đẩy xuống bếp.");
    }

    [HttpPost("merge")]
    [Authorize(Roles = "Staff,Receptionist,Manager,Admin,Cashier")]
    public async Task<IActionResult> MergeOrders([FromBody] MergeOrdersRequest request)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            if (request.SecondaryOrderIds == null || !request.SecondaryOrderIds.Any())
                return Failure("Must provide at least one secondary order to merge.");

            var primaryOrder = await _context.Orders
                .Include(o => o.Table)
                .FirstOrDefaultAsync(o => o.OrderId == request.PrimaryOrderId);

            if (primaryOrder == null)
                return NotFoundResponse("Primary order not found.");
            if (primaryOrder.Status == "CLOSED" || primaryOrder.Status == "CANCELLED")
                return Failure("Primary order cannot be closed or cancelled.");

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var staff = await _context.Staffs.FirstOrDefaultAsync(s => s.UserId == userId);

            foreach (var secondaryId in request.SecondaryOrderIds)
            {
                if (secondaryId == request.PrimaryOrderId) continue;

                var secondaryOrder = await _context.Orders
                    .Include(o => o.OrderItems)
                    .Include(o => o.Table)
                    .FirstOrDefaultAsync(o => o.OrderId == secondaryId);

                if (secondaryOrder == null) continue;
                if (secondaryOrder.Status == "CLOSED" || secondaryOrder.Status == "CANCELLED") continue;

                // Move items
                foreach (var item in secondaryOrder.OrderItems)
                {
                    item.OrderId = primaryOrder.OrderId;
                }

                // Append note
                string mergeNote = $"Merged from {secondaryOrder.OrderCode} (Table {secondaryOrder.Table?.TableCode})";
                primaryOrder.Note = string.IsNullOrEmpty(primaryOrder.Note) ? mergeNote : $"{primaryOrder.Note} | {mergeNote}";

                // Cancel secondary order
                secondaryOrder.Status = "CANCELLED";
                secondaryOrder.Note = string.IsNullOrEmpty(secondaryOrder.Note) 
                    ? $"Merged into {primaryOrder.OrderCode} (Table {primaryOrder.Table?.TableCode})" 
                    : $"{secondaryOrder.Note} | Merged into {primaryOrder.OrderCode}";
                
                // Free table if different and table is set
                if (secondaryOrder.TableId.HasValue && secondaryOrder.TableId != primaryOrder.TableId)
                {
                    var table = await _context.DiningTables.FindAsync(secondaryOrder.TableId);
                    // Only free the table if it's currently occupied. If there's another active order on the same table, it shouldn't realistically happen.
                    if (table != null) table.Status = "AVAILABLE";
                }

                // Add history
                _context.OrderStatusHistories.Add(new OrderStatusHistory
                {
                    OrderId = secondaryOrder.OrderId,
                    OldStatus = "OPEN/SERVED", 
                    NewStatus = "CANCELLED",
                    ChangedByStaffId = staff?.StaffId,
                    ChangedAt = DateTimeHelper.VietnamNow(),
                    Note = $"Merged into order {primaryOrder.OrderCode}"
                });
            }

            // History for primary
            _context.OrderStatusHistories.Add(new OrderStatusHistory
            {
                OrderId = primaryOrder.OrderId,
                OldStatus = primaryOrder.Status,
                NewStatus = primaryOrder.Status,
                ChangedByStaffId = staff?.StaffId,
                ChangedAt = DateTimeHelper.VietnamNow(),
                Note = "Received merged orders"
            });

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Success("Orders merged successfully.");
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return Failure($"Failed to merge orders: {ex.Message}");
        }
    }
}

public class GuestAddItemsRequest
{
    public long TableId { get; set; }
    public List<GuestItemInput> Items { get; set; } = new();
}

public class GuestItemInput
{
    public long MenuItemId { get; set; }
    public int Quantity { get; set; }
    public string? Note { get; set; }
}

public class ConfirmItemsRequest
{
    public List<long> OrderItemIds { get; set; } = new();
}

public class UpdateOrderStatusRequest
{
    public string Status { get; set; } = default!;
}

public class AddOrderItemRequest
{
    public long MenuItemId { get; set; }
    public int Quantity { get; set; }
    public string? Note { get; set; }
}
