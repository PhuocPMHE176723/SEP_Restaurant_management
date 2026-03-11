using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEP_Restaurant_management.Core.Data;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Exceptions;
using SEP_Restaurant_management.Core.Models;

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
    [Authorize(Roles = "Staff,Manager,Admin")]
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
                TableName = o.Table != null ? o.Table.TableCode : null,
                CustomerName = o.Customer != null ? o.Customer.FullName : null,
                OpenedAt = o.OpenedAt,
                ClosedAt = o.ClosedAt,
                TotalAmount = o.OrderItems.Sum(oi => oi.Quantity * oi.UnitPrice),
                OrderItems = o
                    .OrderItems.Select(oi => new OrderItemDTO
                    {
                        OrderItemId = oi.OrderItemId,
                        MenuItemName = oi.ItemNameSnapshot,
                        Quantity = oi.Quantity,
                        UnitPrice = oi.UnitPrice,
                        Note = oi.Note,
                    })
                    .ToList(),
            })
            .ToListAsync();

        return Success(orders);
    }

    [HttpGet("{id}")]
    [Authorize(Roles = "Staff,Manager,Admin")]
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
            TableName = order.Table?.TableCode,
            CustomerName = order.Customer?.FullName,
            OpenedAt = order.OpenedAt,
            ClosedAt = order.ClosedAt,
            TotalAmount = order.OrderItems.Sum(oi => oi.Quantity * oi.UnitPrice),
            OrderItems = order
                .OrderItems.Select(oi => new OrderItemDTO
                {
                    OrderItemId = oi.OrderItemId,
                    MenuItemName = oi.ItemNameSnapshot,
                    Quantity = oi.Quantity,
                    UnitPrice = oi.UnitPrice,
                    Note = oi.Note,
                })
                .ToList(),
        };

        return Success(orderDto);
    }

    [HttpPatch("{id}/status")]
    [Authorize(Roles = "Staff,Manager,Admin")]
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

        if (request.Status == "CLOSED")
        {
            order.ClosedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();

        return Success("Order status updated successfully");
    }

    [HttpPost("{id}/items")]
    [Authorize(Roles = "Staff,Manager,Admin")]
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
            Note = request.Note,
            CreatedAt = DateTime.UtcNow,
        };

        _context.OrderItems.Add(orderItem);
        await _context.SaveChangesAsync();

        return Success("Item added to order successfully");
    }
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
