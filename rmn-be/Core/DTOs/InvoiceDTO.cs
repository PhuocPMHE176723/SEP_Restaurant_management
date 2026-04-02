using System;
using System.Collections.Generic;

namespace SEP_Restaurant_management.Core.DTOs;

public class InvoiceDTO
{
    public long InvoiceId { get; set; }
    public string InvoiceCode { get; set; } = default!;
    public long OrderId { get; set; }
    public long? CustomerId { get; set; }
    public decimal Subtotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal VatAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public string PaymentStatus { get; set; } = default!;
    public DateTime IssuedAt { get; set; }
}

public class InvoicePreviewDTO
{
    public long OrderId { get; set; }
    public string OrderCode { get; set; } = default!;
    public decimal Subtotal { get; set; }
    public decimal DiscountAmount { get; set; }
    public decimal VatAmount { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal DepositDeducted { get; set; }
    public decimal AmountToPay { get; set; }
    public decimal RefundAmount { get; set; }
    public int PointsEarned { get; set; }
    public List<OrderItemDTO> Items { get; set; } = new();
}

public class CheckoutRequest
{
    public string? DiscountCode { get; set; }
    public int PointsToUse { get; set; }
    public decimal PaidAmount { get; set; }
}
