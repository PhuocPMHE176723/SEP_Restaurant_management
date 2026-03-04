using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace SEP_Restaurant_management.Core.DTOs;

public class ReservationDTO
{
    public long ReservationId { get; set; }
    public long? CustomerId { get; set; }
    public int? TableId { get; set; }
    public string CustomerName { get; set; } = default!;
    public string CustomerPhone { get; set; } = default!;
    public int PartySize { get; set; }
    public DateTime ReservedAt { get; set; }
    public int DurationMinutes { get; set; }
    public string Status { get; set; } = default!;
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
    public long? CreatedByStaffId { get; set; }
    public OrderDTO? Order { get; set; }
}

public class OrderDTO
{
    public long OrderId { get; set; }
    public string OrderCode { get; set; } = default!;
    public string Status { get; set; } = default!;
    public decimal Subtotal { get; set; }
    public List<OrderItemDTO> OrderItems { get; set; } = new();
}

public class OrderItemDTO
{
    public long OrderItemId { get; set; }
    public long ItemId { get; set; }
    public string ItemNameSnapshot { get; set; } = default!;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public string? Note { get; set; }
}

public class CreateReservationRequest
{
    [Required]
    public DateTime ReservedAt { get; set; }

    [Required]
    [Range(1, 50)]
    public int PartySize { get; set; }

    [Range(30, 240)]
    public int DurationMinutes { get; set; } = 90;

    [MaxLength(255)]
    public string? Note { get; set; }

    public List<OrderItemRequest> MenuItems { get; set; } = new();
}

public class OrderItemRequest
{
    [Required]
    public long ItemId { get; set; }

    [Required]
    [Range(1, 50)]
    public int Quantity { get; set; }

    [MaxLength(255)]
    public string? Note { get; set; }
}

public class UpdateReservationStatusRequest
{
    [Required]
    [MaxLength(20)]
    public string Status { get; set; } = default!;
}
