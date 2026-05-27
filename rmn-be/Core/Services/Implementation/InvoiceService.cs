using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Services.Interface;

namespace SEP_Restaurant_management.Core.Services.Implementation;

public class InvoiceService
{
    private readonly SepDatabaseContext _context;
    private readonly IMapper _mapper;
    private readonly INotificationService _notificationService;

    public InvoiceService(SepDatabaseContext context, IMapper mapper, INotificationService notificationService)
    {
        _context = context;
        _mapper = mapper;
        _notificationService = notificationService;
    }

    public async Task<InvoicePreviewDTO> PreCalculateInvoiceAsync(
        long orderId,
        string? discountCode,
        int pointsToUse,
        List<long>? selectedItemIds = null,
        long? overrideCustomerId = null
    )
    {
        var order = await _context
            .Orders.Include(o => o.OrderItems)
            .Include(o => o.Reservation)
            .Include(o => o.Customer)
            .FirstOrDefaultAsync(o => o.OrderId == orderId);

        if (order == null)
            throw new Exception("Order not found");

        var selectedItems = order.OrderItems.AsQueryable();

        if (selectedItemIds != null && selectedItemIds.Any())
        {
            selectedItems = selectedItems.Where(oi => selectedItemIds.Contains(oi.OrderItemId));
        }

        var activeItems = order.OrderItems.Where(oi => oi.Status != "CANCELLED").ToList();
        //decimal subtotal = activeItems.Sum(oi => (oi.UnitPrice * oi.Quantity) - oi.DiscountAmount);
        decimal subtotal = selectedItems.Sum(oi =>
            (oi.UnitPrice * oi.Quantity) - oi.DiscountAmount
        );
        decimal discountAmount = 0;
        decimal tierDiscount = 0;

        // 1. Apply Discount Code
        if (!string.IsNullOrEmpty(discountCode))
        {
            var code = await _context.DiscountCodes.FirstOrDefaultAsync(d =>
                d.Code == discountCode
                && d.IsActive
                && (!d.ValidFrom.HasValue || d.ValidFrom <= DateTime.Now)
                && (!d.ValidTo.HasValue || d.ValidTo >= DateTime.Now)
            );

            if (code != null && subtotal >= code.MinOrderValue)
            {
                if (code.DiscountType == "PERCENT")
                {
                    discountAmount = subtotal * (code.DiscountValue / 100m);
                    if (code.MaxDiscountAmount.HasValue)
                        discountAmount = Math.Min(discountAmount, code.MaxDiscountAmount.Value);
                }
                else
                {
                    discountAmount = code.DiscountValue;
                }
            }
        }

        // 2. Apply Loyalty Tier Discount (if eligible)
        long? effectiveCustomerId = overrideCustomerId ?? order.CustomerId;
        if (effectiveCustomerId.HasValue)
        {
            var customer = await _context.Customers.FindAsync(effectiveCustomerId.Value);
            if (customer != null)
            {
                var eligibleTier = await _context
                    .LoyaltyTiers.Where(t => t.IsActive && customer.TotalPoints >= t.MinPoints)
                    .OrderByDescending(t => t.MinPoints)
                    .FirstOrDefaultAsync();

                if (eligibleTier != null && eligibleTier.DiscountRate > 0)
                {
                    var baseForTierDiscount = Math.Max(0, subtotal - discountAmount);
                    tierDiscount = baseForTierDiscount * (eligibleTier.DiscountRate / 100m);
                }
            }
        }

        // 3. Apply Loyalty Points (1 point = redeemRate)
        decimal pointsDiscount = 0;
        if (pointsToUse > 0 && effectiveCustomerId.HasValue)
        {
            var customer = await _context.Customers.FindAsync(effectiveCustomerId.Value);
            if (customer != null)
            {
                var redeemRate = await GetDecimalConfigAsync("LOYALTY_REDEEM_RATE", 1000m);
                int maxPossiblePoints = Math.Min(pointsToUse, customer.TotalPoints);
                pointsDiscount = maxPossiblePoints * redeemRate;
                // Ensure discount doesn't exceed subtotal
                var maxDiscount = Math.Max(0, subtotal - discountAmount - tierDiscount);
                pointsDiscount = Math.Min(pointsDiscount, maxDiscount);
            }
        }

        decimal totalBeforeVat = subtotal - discountAmount - tierDiscount - pointsDiscount;
        decimal vatRate = 8.0m; // Default 8%
        decimal vatAmount = totalBeforeVat * (vatRate / 100m);
        decimal finalTotal = totalBeforeVat + vatAmount;

        // 3. Deduct Deposit
        decimal depositDeducted = 0;
        if (order.Reservation != null && order.Reservation.IsDepositPaid)
        {
            depositDeducted = order.Reservation.DepositAmount;
        }

        decimal amountToPay = Math.Max(0, finalTotal - depositDeducted);
        decimal refundAmount = Math.Max(0, depositDeducted - finalTotal);

        return new InvoicePreviewDTO
        {
            OrderId = orderId,
            OrderCode = order.OrderCode,
            Subtotal = subtotal,
            DiscountAmount = discountAmount + tierDiscount + pointsDiscount,
            VatAmount = vatAmount,
            TotalAmount = finalTotal,
            DepositDeducted = depositDeducted,
            AmountToPay = amountToPay,
            RefundAmount = refundAmount,
            PointsEarned = (int)
                Math.Floor(amountToPay / await GetDecimalConfigAsync("LOYALTY_EARN_RATE", 100000m)),
            Items = activeItems
                .Select(oi => new OrderItemDTO
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
    }

    public async Task<Invoice> ProcessCheckoutAsync(
        long orderId,
        long staffId,
        string? discountCode,
        int pointsToUse,
        decimal paidAmount,
        List<long>? selectedItemIds = null,
        long? overrideCustomerId = null
    )
    {
        var preview = await PreCalculateInvoiceAsync(
            orderId,
            discountCode,
            pointsToUse,
            selectedItemIds,
            overrideCustomerId
        );
        var order = await _context
            .Orders.Include(o => o.OrderTables)
                .ThenInclude(ot => ot.DiningTable)
            .Include(o => o.Reservation)
            .Include(o => o.Customer)
            .FirstAsync(o => o.OrderId == orderId);

        // Create Invoice
        var invoice = new Invoice
        {
            InvoiceCode = $"INV-{DateTime.Now.NowHours()}:{DateTime.Now.NowMinutes()}-{orderId}",
            OrderId = orderId,
            CustomerId = overrideCustomerId ?? order.CustomerId,
            Subtotal = preview.Subtotal,
            DiscountAmount = preview.DiscountAmount,
            VatAmount = preview.VatAmount,
            TotalAmount = preview.TotalAmount,
            PaidAmount = paidAmount,
            PaymentStatus = paidAmount >= preview.AmountToPay ? "PAID" : "PARTIAL",
            IssuedAt = DateTime.Now,
            IssuedByStaffId = staffId,
        };

        _context.Invoices.Add(invoice);

        // Update Order & Table
        order.Status = "CLOSED";
        order.ClosedAt = DateTime.Now;

        // 1. Release Primary Table
        if (order.TableId.HasValue)
        {
            var primaryTable = await _context.DiningTables.FindAsync(order.TableId.Value);
            if (primaryTable != null)
                primaryTable.Status = "AVAILABLE";
        }

        // 2. Release all linked tables in n-n relationship
        if (order.OrderTables != null)
        {
            foreach (var ot in order.OrderTables)
            {
                if (ot.DiningTable != null)
                {
                    ot.DiningTable.Status = "AVAILABLE";
                }
            }
        }
        if (order.Reservation != null)
        {
            order.Reservation.Status = "COMPLETED";
        }
        //Update items
        if (selectedItemIds != null && selectedItemIds.Any())
        {
            foreach (var item in order.OrderItems)
            {
                bool isSelected = selectedItemIds.Contains(item.OrderItemId);

                if (!isSelected && item.Status == "PENDING")
                {
                    item.Status = "CANCELLED";
                }
            }
        }
        // Points Ledger
        long? finalCustomerId = overrideCustomerId ?? order.CustomerId;
        if (finalCustomerId.HasValue)
        {
            var customer = await _context.Customers.FindAsync(finalCustomerId.Value);
            if (customer != null)
            {
                // Update order's customer if it was overridden
                if (order.CustomerId != finalCustomerId)
                {
                    order.CustomerId = finalCustomerId;
                }

            // Spend points
            if (pointsToUse > 0)
            {
                int used = Math.Min(pointsToUse, customer.TotalPoints);
                customer.TotalPoints -= used;
                _context.CustomerPointsLedgers.Add(
                    new CustomerPointsLedger
                    {
                        CustomerId = customer.CustomerId,
                        RefType = "REDEEM",
                        PointsChange = -used,
                        CreatedAt = DateTime.Now,
                        Note = $"Dùng điểm cho hóa đơn {invoice.InvoiceCode}",
                    }
                );
            }

            // Earn points (5% of paid amount -> / 20000 approx)
            int earned = preview.PointsEarned;
            if (earned > 0)
            {
                customer.TotalPoints += earned;
                _context.CustomerPointsLedgers.Add(
                    new CustomerPointsLedger
                    {
                        CustomerId = customer.CustomerId,
                        RefType = "INVOICE",
                        RefId = invoice.InvoiceId,
                        PointsChange = earned,
                        CreatedAt = DateTime.Now,
                        Note = $"Tích điểm từ hóa đơn {invoice.InvoiceCode}",
                    }
                );
            }
        }
    }

    await _context.SaveChangesAsync();

    try
    {
        var tableCodes = order.OrderTables != null 
            ? string.Join(", ", order.OrderTables.Select(ot => ot.DiningTable?.TableCode).Where(c => c != null)) 
            : "";
        if (string.IsNullOrEmpty(tableCodes) && order.TableId.HasValue)
        {
            var table = await _context.DiningTables.FindAsync(order.TableId.Value);
            if (table != null) tableCodes = table.TableCode;
        }

        await _notificationService.CreateNotificationAsync(
            title: "Thanh toán thành công",
            message: $"Hóa đơn {invoice.InvoiceCode} (bàn {tableCodes}) đã thanh toán thành công {invoice.TotalAmount:N0} VNĐ.",
            type: "PAYMENT",
            userId: invoice.CustomerId?.ToString(),
            role: "Staff",
            relatedId: invoice.InvoiceCode
        );
    }
    catch { }

    return invoice;
    }

    private async Task<decimal> GetDecimalConfigAsync(string key, decimal defaultValue)
    {
        var config = await _context.SystemConfigs.FirstOrDefaultAsync(c => c.ConfigKey == key);
        if (config != null && decimal.TryParse(config.ConfigValue, out var parsed))
        {
            return parsed;
        }

        return defaultValue;
    }
}

// Helper to avoid build error with DateTime
public static class DateTimeExtensions
{
    public static string NowHours(this DateTime dt) => DateTime.Now.Hour.ToString("D2");

    public static string NowMinutes(this DateTime dt) => DateTime.Now.Minute.ToString("D2");
}
