namespace rmn_be.Core.DTOs
{
    public class CookingListItemDTO
    {
        public long ItemId { get; set; }
        public string ItemName { get; set; } = null!;
        public string? Thumbnail { get; set; }
        public string? Unit { get; set; }

        // preorder + pending + chưa check-in
        public int TotalPreOrderQuantity { get; set; }

        // preorder + pending + đã check-in
        public int MustCookQuantity { get; set; }

        // status = COOKING
        public int CookingQuantity { get; set; }

        // status = READY_SERVE
        public int ReadyServeQuantity { get; set; }

    }
}
