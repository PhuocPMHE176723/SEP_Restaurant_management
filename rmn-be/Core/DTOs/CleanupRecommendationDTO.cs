using System;
using System.Collections.Generic;

namespace SEP_Restaurant_management.Core.DTOs;

public class CleanupWindowDTO
{
    public string Label { get; set; } = string.Empty;
    public DateTime Start { get; set; }
    public DateTime End { get; set; }
}

public class TableReminderDTO
{
    public int TableId { get; set; }
    public string TableCode { get; set; } = string.Empty;
    public string? TableName { get; set; }
    public string Status { get; set; } = string.Empty;
    public long? OrderId { get; set; }
    public DateTime? OrderOpenedAt { get; set; }
    public int MinutesOccupied { get; set; }
    public string Reason { get; set; } = string.Empty;
    public int Priority { get; set; }
}

public class CleanupRecommendationDTO
{
    public DateTime Date { get; set; }
    public DateTime GeneratedAt { get; set; }
    public List<CleanupWindowDTO> Windows { get; set; } = new();
    public List<TableReminderDTO> Reminders { get; set; } = new();
}
