namespace rmn_be.Core.DTOs
{
    public class ServingItemDTO
    {
        public long ItemId { get; set; }
        public string ItemName { get; set; } = null!;
        public string? Thumbnail { get; set; }
        public string? Unit { get; set; }
        public int ReadyQuantity { get; set; }
        public int WaitingTableCount { get; set; }
    }

    public class ServingTableDTO
    {
        public long OrderId { get; set; }
        public string OrderCode { get; set; } = null!;
        public string TableNames { get; set; } = "Mang về";
        public string DisplayLabel { get; set; } = null!;

        public int OrderedQuantity { get; set; }
        public int ReadyQuantity { get; set; }
        public int ServedQuantity { get; set; }

        public bool Priority { get; set; }
        public DateTime OpenedAt { get; set; }
    }

    public class ServeReadyItemRequestDTO
    {
        public long OrderId { get; set; }
        public int Quantity { get; set; } = 1;
    }

    public class ReassignReadyItemRequestDTO
    {
        public long FromOrderId { get; set; }
        public long ToOrderId { get; set; }
        public int Quantity { get; set; } = 1;
    }
}
