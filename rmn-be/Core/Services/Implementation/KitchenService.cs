using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.DTOs;
using AutoMapper;

namespace SEP_Restaurant_management.Core.Services.Implementation;

public class KitchenService
{
    private readonly SepDatabaseContext _context;
    private readonly IMapper _mapper;

    public KitchenService(SepDatabaseContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<List<OrderItemDTO>> GetKitchenQueueAsync()
    {
        var items = await _context.OrderItems
            .Include(oi => oi.Order)
                .ThenInclude(o => o.Table)
            .Where(oi => oi.Status == "COOKING" || oi.Status == "PENDING" && oi.Order.Status == "SENT_TO_KITCHEN")
            .OrderBy(oi => oi.CreatedAt)
            .ToListAsync();

        return _mapper.Map<List<OrderItemDTO>>(items);
    }

    public async Task<bool> UpdateItemStatusAsync(long orderItemId, string status)
    {
        var item = await _context.OrderItems.FindAsync(orderItemId);
        if (item == null) return false;

        item.Status = status.ToUpper();
        await _context.SaveChangesAsync();

        // If all items in an order are SERVED, update the Order status
        var orderId = item.OrderId;
        var allItemsServed = await _context.OrderItems
            .Where(oi => oi.OrderId == orderId)
            .AllAsync(oi => oi.Status == "SERVED" || oi.Status == "CANCELLED");

        if (allItemsServed)
        {
            var order = await _context.Orders.FindAsync(orderId);
            if (order != null && order.Status != "CLOSED")
            {
                order.Status = "SERVED";
                await _context.SaveChangesAsync();
            }
        }

        return true;
    }
}
