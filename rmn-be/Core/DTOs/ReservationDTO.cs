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
    public string? ContactEmail { get; set; }
    public int PartySize { get; set; }
    public DateTime ReservedAt { get; set; }
    public int DurationMinutes { get; set; }
    public string Status { get; set; } = default!;
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; }
    public long? CreatedByStaffId { get; set; }
    public decimal DepositAmount { get; set; }
    public bool IsDepositPaid { get; set; }
    public DateTime? DepositPaidAt { get; set; }
    public OrderDTO? Order { get; set; }
}

public class OrderDTO
{
    public long OrderId { get; set; }
    public string OrderCode { get; set; } = default!;
    public string Status { get; set; } = default!;
    public string? TableName { get; set; }
    public string OrderType { get; set; } = "DINE_IN";
    public int? TableId { get; set; }
    public string? CustomerName { get; set; }
    public DateTime OpenedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
    public decimal TotalAmount { get; set; }
    public List<OrderItemDTO> OrderItems { get; set; } = new();
}

public class OrderItemDTO
{
    public long OrderItemId { get; set; }
    public string ItemNameSnapshot { get; set; } = default!;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public string? Status { get; set; }
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

    [EmailAddress]
    [MaxLength(150)]
    public string? ContactEmail { get; set; }

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

    /// <summary>Tuỳ chọn gán/chuyển bàn khi cập nhật trạng thái</summary>
    public int? TableId { get; set; }
}

public class CreateWalkinOrderRequest
{
    [Required]
    [MinLength(1, ErrorMessage = "At least one table must be selected.")]
    public List<int> TableIds { get; set; } = new();

    [Required]
    [MaxLength(150)]
    public string Name { get; set; } = default!;

    [Required]
    [MaxLength(20)]
    public string Phone { get; set; } = default!;

    [Range(1, 100)]
    public int PartySize { get; set; }

    [MaxLength(255)]
    public string? Note { get; set; }
}

public class TransferTableRequest
{
    public int FromTableId { get; set; }
    public int ToTableId { get; set; }
    public string? Reason { get; set; }
}

public class MergeOrdersRequest
{
    [Required]
    public long PrimaryOrderId { get; set; }
    
    [Required]
    [MinLength(1, ErrorMessage = "Must select at least one secondary order to merge.")]
    public List<long> SecondaryOrderIds { get; set; } = new();
}
