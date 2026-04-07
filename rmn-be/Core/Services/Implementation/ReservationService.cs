using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Middlewares;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Services.Interface;

namespace SEP_Restaurant_management.Core.Services.Implementation;

public class ReservationService : IReservationService
{
    private readonly SepDatabaseContext _context;
    private readonly IMapper _mapper;

    public ReservationService(SepDatabaseContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<ReservationDTO> CreateReservationAsync(
        long customerId,
        CreateReservationRequest request
    )
    {
        try
        {
            // Get customer info
            var customer = await _context
                .Customers.Include(c => c.User)
                .FirstOrDefaultAsync(c => c.CustomerId == customerId);

            if (customer == null)
            {
                throw new Exception("Customer not found");
            }

            // Create reservation first
            var reservation = new Reservation
            {
                CustomerId = customerId,
                CustomerName = customer.User?.FullName ?? customer.FullName ?? "Guest",
                CustomerPhone = customer.User?.PhoneNumber ?? customer.Phone ?? "N/A",
                PartySize = request.PartySize,
                ReservedAt = request.ReservedAt,
                DurationMinutes = request.DurationMinutes,
                Status = "PENDING",
                Note = request.Note,
                ContactEmail = request.ContactEmail ?? customer.User?.Email,
                CreatedAt = DateTimeHelper.VietnamNow(),
                CreatedByStaffId = null,
            };

            _context.Reservations.Add(reservation);
            await _context.SaveChangesAsync();

            // Calculate and set DepositAmount (Min 50,000 VND, otherwise 50% of total order)
            decimal totalOrderAmount = 0;
            if (request.MenuItems != null && request.MenuItems.Count > 0)
            {
                // Generate order code
                var orderCode =
                    $"RES-{reservation.ReservationId}-{DateTimeHelper.VietnamNow():yyyyMMddHHmmss}";

                var order = new Order
                {
                    OrderCode = orderCode,
                    ReservationId = reservation.ReservationId,
                    CustomerId = customerId,
                    OrderType = "DINE_IN",
                    Status = "RESERVED",
                    OpenedAt = DateTimeHelper.VietnamNow(),
                    CreatedByStaffId = null,
                    Note = "Pre-order from reservation",
                };

                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                // Create order items (orderdetail)
                foreach (var item in request.MenuItems)
                {
                    var menuItem = await _context
                        .MenuItems.Include(m => m.MenuItemPrices)
                        .FirstOrDefaultAsync(m => m.ItemId == item.ItemId);

                    if (menuItem == null)
                    {
                        continue;
                    }

                    // Get current price from MenuItemPrices, fallback to BasePrice
                    var currentPrice = menuItem
                        .MenuItemPrices.Where(p => p.EffectiveFrom <= DateTimeHelper.VietnamNow())
                        .OrderByDescending(p => p.EffectiveFrom)
                        .FirstOrDefault();

                    var unitPrice = currentPrice?.Price ?? menuItem.BasePrice;

                    var orderItem = new OrderItem
                    {
                        OrderId = order.OrderId,
                        ItemId = item.ItemId,
                        Quantity = item.Quantity,
                        UnitPrice = unitPrice,
                        DiscountAmount = 0, // Simplified for now
                        ItemNameSnapshot = menuItem.ItemName,
                        CreatedAt = DateTimeHelper.VietnamNow(),
                    };

                    _context.OrderItems.Add(orderItem);
                }

                await _context.SaveChangesAsync();

                // Calculate total
                var orderItems = await _context.OrderItems
                    .Where(oi => oi.OrderId == order.OrderId)
                    .ToListAsync();
                
                foreach (var oi in orderItems)
                {
                    totalOrderAmount += (oi.UnitPrice * oi.Quantity) - oi.DiscountAmount;
                }
            }

            // Minimum deposit is 200,000 VND to ensure booking quality
            const decimal minDeposit = 200000;
            reservation.DepositAmount = Math.Max(minDeposit, totalOrderAmount * 0.5m);
            
            await _context.SaveChangesAsync();
            return _mapper.Map<ReservationDTO>(reservation);
        }
        catch (Exception ex)
        {
            throw new Exception($"Failed to create reservation: {ex.Message}", ex);
        }
    }

    public async Task<List<ReservationDTO>> GetCustomerReservationsAsync(long customerId)
    {
        var reservations = await _context
            .Reservations.Where(r => r.CustomerId == customerId)
            .Include(r => r.Order)
                .ThenInclude(o => o!.OrderItems)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return _mapper.Map<List<ReservationDTO>>(reservations);
    }

    public async Task<List<ReservationDTO>> GetAllReservationsAsync(DateTime? startDate = null, DateTime? endDate = null)
    {
        var query = _context.Reservations
            .Include(r => r.Order)
                .ThenInclude(o => o!.OrderItems)
            .AsQueryable();

        if (startDate.HasValue)
        {
            var start = startDate.Value.Date;
            query = query.Where(r => r.ReservedAt >= start);
        }

        if (endDate.HasValue)
        {
            var end = endDate.Value.Date.AddDays(1).AddTicks(-1); // End of day
            query = query.Where(r => r.ReservedAt <= end);
        }

        var reservations = await query
            .OrderByDescending(r => r.ReservedAt)
            .ToListAsync();

        return _mapper.Map<List<ReservationDTO>>(reservations);
    }

    public async Task<ReservationDTO?> GetReservationByIdAsync(long reservationId)
    {
        var reservation = await _context.Reservations.FirstOrDefaultAsync(r =>
            r.ReservationId == reservationId
        );

        return reservation == null ? null : _mapper.Map<ReservationDTO>(reservation);
    }

    public async Task<bool> CancelReservationAsync(long reservationId, long customerId)
    {
        var reservation = await _context.Reservations.FirstOrDefaultAsync(r =>
            r.ReservationId == reservationId && r.CustomerId == customerId
        );

        if (reservation == null || reservation.Status == "CANCELLED")
        {
            return false;
        }

        reservation.Status = "CANCELLED";

        // Cancel associated order and order items if exists
        var order = await _context
            .Orders.Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.ReservationId == reservationId);

        if (order != null)
        {
            order.Status = "CANCELLED";
            order.ClosedAt = DateTimeHelper.VietnamNow();

            // Cancel all order items
            foreach (var orderItem in order.OrderItems)
            {
                orderItem.Status = "CANCELLED";
            }
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> CancelUnpaidReservationAsync(long reservationId)
    {
        var reservation = await _context.Reservations.FirstOrDefaultAsync(r =>
            r.ReservationId == reservationId
        );

        if (reservation == null || reservation.Status != "PENDING")
        {
            return false;
        }

        // Optional: Ensure it has been at least 4.5 minutes since creation to prevent abuse
        // But since the user wants automatic cancellation on frontend timeout, we can allow it
        // Or we can rigorously check the time. We'll just allow it if status is still PENDING.

        reservation.Status = "CANCELLED";
        reservation.Note = (reservation.Note + " - Hủy tự động do quá thời gian thanh toán cọc").Trim();

        // Cancel associated order and order items if exists
        var order = await _context
            .Orders.Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.ReservationId == reservationId);

        if (order != null)
        {
            order.Status = "CANCELLED";
            order.ClosedAt = DateTimeHelper.VietnamNow();

            foreach (var orderItem in order.OrderItems)
            {
                orderItem.Status = "CANCELLED";
            }
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateReservationStatusAsync(
        long id,
        string status,
        int? tableId = null
    )
    {
        var allowedStatuses = new HashSet<string>
        {
            "PENDING",
            "CONFIRMED",
            "CANCELLED",
            "CHECKED_IN",
            "COMPLETED",
            "NO_SHOW",
        };

        if (!allowedStatuses.Contains(status.ToUpper()))
        {
            return false;
        }

        var reservation = await _context.Reservations
            .Include(r => r.Table)
            .FirstOrDefaultAsync(r => r.ReservationId == id);

        if (reservation == null)
        {
            return false;
        }

        string oldStatus = reservation.Status;
        reservation.Status = status.ToUpper();

        // 1. Handle Table Assignment & Status Sync
        if (tableId.HasValue)
        {
            var table = await _context.DiningTables.FindAsync(tableId.Value);
            if (table == null) return false;

            // Release old table if changed
            if (reservation.TableId.HasValue && reservation.TableId != tableId)
            {
                var oldTable = await _context.DiningTables.FindAsync(reservation.TableId.Value);
                if (oldTable != null && (oldTable.Status == "RESERVED" || oldTable.Status == "OCCUPIED"))
                {
                    oldTable.Status = "AVAILABLE";
                }
            }

            reservation.TableId = tableId;

            // Update new table status
            if (status.ToUpper() == "CHECKED_IN")
            {
                table.Status = "OCCUPIED";
            }
            else if (status.ToUpper() == "CONFIRMED")
            {
                table.Status = "RESERVED";
            }
        }
        else if (reservation.TableId.HasValue)
        {
            // If status changed to CANCELLED or NO_SHOW, release the table
            if (status.ToUpper() == "CANCELLED" || status.ToUpper() == "NO_SHOW" || status.ToUpper() == "COMPLETED")
            {
                var table = await _context.DiningTables.FindAsync(reservation.TableId.Value);
                if (table != null) table.Status = "AVAILABLE";
            }
        }

        // 2. Handle associated Order based on new status
        var order = await _context.Orders
            .Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.ReservationId == id);

        if (order != null)
        {
            if (status.ToUpper() == "CHECKED_IN")
            {
                order.Status = "OPEN";
                if (reservation.TableId.HasValue)
                {
                    order.TableId = reservation.TableId;
                }
            }
            else if (status.ToUpper() == "CANCELLED" || status.ToUpper() == "NO_SHOW")
            {
                order.Status = "CANCELLED";
                order.ClosedAt = DateTimeHelper.VietnamNow();
                foreach (var orderItem in order.OrderItems)
                {
                    orderItem.Status = "CANCELLED";
                }
            }
        }

        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> UpdateReservationItemsAsync(long reservationId, long customerId, List<OrderItemRequest> newItems)
    {
        var reservation = await _context.Reservations
            .Include(r => r.Order)
            .ThenInclude(o => o.OrderItems)
            .FirstOrDefaultAsync(r => r.ReservationId == reservationId && r.CustomerId == customerId);

        if (reservation == null || reservation.Status != "PENDING")
        {
            return false;
        }

        var order = reservation.Order;
        
        // If no existing order, create one if newItems is not empty
        if (order == null)
        {
            if (newItems != null && newItems.Any())
            {
                var code = $"OD-{DateTime.Now:yyyyMMdd}-{new Random().Next(1000, 9999)}";
                order = new Order
                {
                    OrderCode = code,
                    CustomerId = customerId,
                    ReservationId = reservationId,
                    Status = "PENDING",
                    OpenedAt = DateTimeHelper.VietnamNow(),
                    OrderItems = new List<OrderItem>()
                };
                _context.Orders.Add(order);
                reservation.Order = order;
            }
            else
            {
                return true; // No order, no items, nothing to do
            }
        }
        
        // Clear existing items
        if (order.OrderItems != null && order.OrderItems.Any())
        {
            _context.OrderItems.RemoveRange(order.OrderItems);
            order.OrderItems.Clear();
        }

        // Add new items
        decimal total = 0;
        if (newItems != null && newItems.Any())
        {
            foreach (var req in newItems)
            {
                var menu = await _context.MenuItems.FindAsync(req.ItemId);
                if (menu != null && menu.IsActive)
                {
                    var price = menu.BasePrice;
                    var itemTotal = price * req.Quantity;
                    total += itemTotal;
                    order.OrderItems ??= new List<OrderItem>();
                    order.OrderItems.Add(new OrderItem
                    {
                        ItemId = req.ItemId,
                        ItemNameSnapshot = menu.ItemName,
                        Quantity = req.Quantity,
                        UnitPrice = price,
                        Note = req.Note,
                        Status = "PENDING",
                        CreatedAt = DateTimeHelper.VietnamNow()
                    });
                }
            }
        }
        
        if (total == 0)
        {
            // If no items left, remove the order
            _context.Orders.Remove(order);
            reservation.Order = null;
        }

        // Update reservation note to indicate items were changed
        string editNote = "(Đã cập nhật món)";
        if (string.IsNullOrEmpty(reservation.Note)) {
            reservation.Note = editNote;
        } else if (!reservation.Note.Contains(editNote)) {
            reservation.Note = reservation.Note.Trim() + " " + editNote;
        }
        reservation.DepositAmount = total * 0.5m;
        
        await _context.SaveChangesAsync();
        return true;
    }
}
