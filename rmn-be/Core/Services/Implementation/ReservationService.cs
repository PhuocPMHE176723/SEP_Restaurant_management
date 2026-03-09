using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Services.Interface;
using SEP_Restaurant_management.Core.Middlewares;

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

    public async Task<ReservationDTO> CreateReservationAsync(long customerId, CreateReservationRequest request)
    {
        try
        {
            // Get customer info
            var customer = await _context.Customers
                .Include(c => c.User)
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
                CreatedAt = DateTimeHelper.VietnamNow(),
                CreatedByStaffId = null
            };

            _context.Reservations.Add(reservation);
            await _context.SaveChangesAsync();

            // Create order if menu items are selected
            if (request.MenuItems != null && request.MenuItems.Count > 0)
            {
                // Generate order code
                var orderCode = $"RES-{reservation.ReservationId}-{DateTimeHelper.VietnamNow():yyyyMMddHHmmss}";

                var order = new Order
                {
                    OrderCode = orderCode,
                    ReservationId = reservation.ReservationId,
                    CustomerId = customerId,
                    OrderType = "DINE_IN",
                    Status = "RESERVED",
                    OpenedAt = DateTimeHelper.VietnamNow(),
                    CreatedByStaffId = null,
                    Note = "Pre-order from reservation"
                };

                _context.Orders.Add(order);
                await _context.SaveChangesAsync();

                // Create order items (orderdetail)
                foreach (var item in request.MenuItems)
                {
                    var menuItem = await _context.MenuItems
                        .Include(m => m.MenuItemPrices)
                        .FirstOrDefaultAsync(m => m.ItemId == item.ItemId);

                    if (menuItem == null)
                    {
                        continue;
                    }

                    // Get current price from MenuItemPrices, fallback to BasePrice
                    var currentPrice = menuItem.MenuItemPrices
                        .Where(p => p.EffectiveFrom <= DateTimeHelper.VietnamNow())
                        .OrderByDescending(p => p.EffectiveFrom)
                        .FirstOrDefault();

                    var unitPrice = currentPrice?.Price ?? menuItem.BasePrice;

                    var orderItem = new OrderItem
                    {
                        OrderId = order.OrderId,
                        ItemId = item.ItemId,
                        ItemNameSnapshot = menuItem.ItemName,
                        UnitPrice = unitPrice,
                        Quantity = item.Quantity,
                        DiscountAmount = 0,
                        Status = "PENDING",
                        Note = item.Note,
                        CreatedAt = DateTimeHelper.VietnamNow()
                    };

                    _context.OrderItems.Add(orderItem);
                }

                await _context.SaveChangesAsync();
            }

            return _mapper.Map<ReservationDTO>(reservation);
        }
        catch (Exception ex)
        {
            throw new Exception($"Failed to create reservation: {ex.Message}", ex);
        }
    }

    public async Task<List<ReservationDTO>> GetCustomerReservationsAsync(long customerId)
    {
        var reservations = await _context.Reservations
            .Where(r => r.CustomerId == customerId)
            .Include(r => r.Order)
                .ThenInclude(o => o!.OrderItems)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return _mapper.Map<List<ReservationDTO>>(reservations);
    }

    public async Task<List<ReservationDTO>> GetAllReservationsAsync()
    {
        var reservations = await _context.Reservations
            .Include(r => r.Order)
                .ThenInclude(o => o!.OrderItems)
            .OrderByDescending(r => r.ReservedAt)
            .ToListAsync();

        return _mapper.Map<List<ReservationDTO>>(reservations);
    }

    public async Task<ReservationDTO?> GetReservationByIdAsync(long reservationId)
    {
        var reservation = await _context.Reservations
            .FirstOrDefaultAsync(r => r.ReservationId == reservationId);

        return reservation == null ? null : _mapper.Map<ReservationDTO>(reservation);
    }

    public async Task<bool> CancelReservationAsync(long reservationId, long customerId)
    {
        var reservation = await _context.Reservations
            .FirstOrDefaultAsync(r => r.ReservationId == reservationId && r.CustomerId == customerId);

        if (reservation == null || reservation.Status == "CANCELLED")
        {
            return false;
        }

        reservation.Status = "CANCELLED";
        
        // Cancel associated order and order items if exists
        var order = await _context.Orders
            .Include(o => o.OrderItems)
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
}
