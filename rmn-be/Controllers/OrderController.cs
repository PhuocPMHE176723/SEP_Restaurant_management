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
    public async Task<IActionResult> GetAllOrders()
    {
        var orders = await _context
            .Orders.Include(o => o.Table)
            .Include(o => o.Reservation)
            .Include(o => o.Customer)
            .Include(o => o.OrderItems)
            .OrderByDescending(o => o.OpenedAt)
            .Select(o => new OrderDTO
            {
                OrderId = o.OrderId,
                OrderCode = o.OrderCode,
                Status = o.Status,
                TableId = o.TableId,
                TableName = o.Table != null ? o.Table.TableCode : null,
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
    [Authorize(Roles = "Staff,Manager,Admin,Kitchen,Cashier")]
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
            
            // Reset table status to AVAILABLE
            var table = await _context.DiningTables.FindAsync(order.TableId);
            if (table != null)
            {
                table.Status = "AVAILABLE";
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

            // 2. Validate Table
            var table = await _context.DiningTables.FindAsync(request.TableId);
            if (table == null) return NotFoundResponse("Table not found");
            if (table.Status != "AVAILABLE") return Failure("Table is not available");

            // 3. Get Staff ID
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var staff = await _context.Staffs.FirstOrDefaultAsync(s => s.UserId == userId);
            
            // 4. Create Order
            var orderCode = $"WALK-{DateTimeHelper.VietnamNow():yyyyMMdd}-{Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper()}";
            var order = new Order
            {
                OrderCode = orderCode,
                TableId = request.TableId,
                CustomerId = customer.CustomerId,
                OrderType = "DINE_IN",
                Status = "OPEN",
                OpenedAt = DateTimeHelper.VietnamNow(),
                CreatedByStaffId = staff?.StaffId,
                Note = request.Note
            };

            _context.Orders.Add(order);

            // 5. Update Table Status
            table.Status = "OCCUPIED";

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
        
        // 1. Tự động trừ kho nếu món ăn được phục vụ (SERVED)
        if (request.Status == "SERVED")
        {
            var ingredients = await _context.MenuItemIngredients
                .Where(mi => mi.ItemId == orderItem.ItemId)
                .ToListAsync();

            foreach (var ing in ingredients)
            {
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
