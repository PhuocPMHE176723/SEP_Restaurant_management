using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Models;

namespace SEP_Restaurant_management.Core.Services.Implementation;

public class InvoiceService
{
    private readonly SepDatabaseContext _context;
    private readonly IMapper _mapper;

    public InvoiceService(SepDatabaseContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<InvoicePreviewDTO> PreCalculateInvoiceAsync(
        long orderId,
        string? discountCode,
        int pointsToUse
    )
    {
        var order = await _context
            .Orders.Include(o => o.OrderItems)
            .Include(o => o.Reservation)
            .Include(o => o.Customer)
            .FirstOrDefaultAsync(o => o.OrderId == orderId);

        if (order == null)
            throw new Exception("Order not found");

        var activeItems = order.OrderItems.Where(oi => oi.Status != "CANCELLED").ToList();
        decimal subtotal = activeItems.Sum(oi => (oi.UnitPrice * oi.Quantity) - oi.DiscountAmount);
        decimal discountAmount = 0;

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

        // 2. Apply Loyalty Points (1 point = 1000đ)
        decimal pointsDiscount = 0;
        if (pointsToUse > 0 && order.CustomerId.HasValue)
        {
            var customer = await _context.Customers.FindAsync(order.CustomerId.Value);
            if (customer != null)
            {
                int maxPossiblePoints = Math.Min(pointsToUse, customer.TotalPoints);
                pointsDiscount = maxPossiblePoints * 1000m;
                // Ensure discount doesn't exceed subtotal
                pointsDiscount = Math.Min(pointsDiscount, subtotal - discountAmount);
            }
        }

        decimal totalBeforeVat = subtotal - discountAmount - pointsDiscount;
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
            DiscountAmount = discountAmount + pointsDiscount,
            VatAmount = vatAmount,
            TotalAmount = finalTotal,
            DepositDeducted = depositDeducted,
            AmountToPay = amountToPay,
            RefundAmount = refundAmount,
            PointsEarned = (int)(amountToPay / 20000), // 1 point per 20k paid
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
        decimal paidAmount
    )
    {
        var preview = await PreCalculateInvoiceAsync(orderId, discountCode, pointsToUse);
        var order = await _context
            .Orders.Include(o => o.Table)
            .Include(o => o.Reservation)
            .Include(o => o.Customer)
            .FirstAsync(o => o.OrderId == orderId);

        // Create Invoice
        var invoice = new Invoice
        {
            InvoiceCode = $"INV-{DateTime.Now.NowHours()}:{DateTime.Now.NowMinutes()}-{orderId}",
            OrderId = orderId,
            CustomerId = order.CustomerId,
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
        if (order.Table != null)
        {
            order.Table.Status = "AVAILABLE";
        }
        if (order.Reservation != null)
        {
            order.Reservation.Status = "COMPLETED";
        }

        // Points Ledger
        if (order.CustomerId.HasValue)
        {
            var customer = order.Customer!;

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

        await _context.SaveChangesAsync();
        return invoice;
    }
}

// Helper to avoid build error with DateTime
public static class DateTimeExtensions
{
    public static string NowHours(this DateTime dt) => DateTime.Now.Hour.ToString("D2");

    public static string NowMinutes(this DateTime dt) => DateTime.Now.Minute.ToString("D2");
}
