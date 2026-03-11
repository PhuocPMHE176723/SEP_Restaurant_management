namespace SEP_Restaurant_management.Core.DTOs;

// ── DiningTable DTOs ─────────────────────────────────────────────
public class DiningTableDTO
{
    public int TableId { get; set; }
    public string TableCode { get; set; } = null!;
    public string? TableName { get; set; }
    public int Capacity { get; set; }
    public string Status { get; set; } = null!;
    public bool IsActive { get; set; }
}

public class DiningTableWithOrderDTO : DiningTableDTO
{
    public CurrentOrderDTO? CurrentOrder { get; set; }
}

public class CurrentOrderDTO
{
    public long OrderId { get; set; }
    public string OrderCode { get; set; } = null!;
    public string? CustomerName { get; set; }
    public decimal TotalAmount { get; set; }
    public int ItemCount { get; set; }
}

public class CreateDiningTableDTO
{
    public string TableCode { get; set; } = null!;
    public string? TableName { get; set; }
    public int Capacity { get; set; }
    public string Status { get; set; } = "AVAILABLE";
}

public class UpdateDiningTableDTO
{
    public string? TableCode { get; set; }
    public string? TableName { get; set; }
    public int? Capacity { get; set; }
    public string? Status { get; set; }
    public bool? IsActive { get; set; }
}
