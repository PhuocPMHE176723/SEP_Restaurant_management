namespace SEP_Restaurant_management.Core.DTOs;

public class TableAvailabilityDTO
{
    public int TableId { get; set; }
    public string TableCode { get; set; } = default!;
    public string TableName { get; set; } = default!;
    public int Capacity { get; set; }
    public bool IsAvailable { get; set; }
    public string StatusMessage { get; set; } = "Available";
    public string? CustomerName { get; set; }
}
