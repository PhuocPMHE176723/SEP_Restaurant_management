namespace rmn_be.Core.DTOs
{
    public class AssignableTableDTO
    {
        public int TableId { get; set; }
        public string TableCode { get; set; } = default!;
        public string TableName { get; set; } = default!;
        public int Capacity { get; set; }

        // Bàn đang có khách thực tế
        public bool IsOccupied { get; set; }

        // Bàn đã được reservation khác giữ trong khung giờ
        public bool IsReserved { get; set; }

        // Có được phép chọn để gán không
        public bool IsSelectable { get; set; }

        // Trạng thái hiển thị ngoài UI
        public string StatusMessage { get; set; } = default!;

        // Nếu bị conflict thì trả thông tin reservation đang giữ bàn
        public long? ConflictReservationId { get; set; }
        public string? ConflictCustomerName { get; set; }
    }
    public class ReservationAssignTablesResponseDTO
    {
        public long ReservationId { get; set; }
        public string ReservationCode { get; set; } = default!;
        public string CustomerName { get; set; } = default!;

        public int NumberOfGuest { get; set; }
        public int NumberOfTable { get; set; }
        public int table4Count { get; set; }
        public int table6Count { get; set; }
        public int table8Count { get; set; }
        public DateTime ReservedAt { get; set; }
        public string Shift { get; set; } = default!;

        // Các bàn hiện đang được gán cho reservation này
        public List<int> SelectedTableIds { get; set; } = new();

        // Danh sách tất cả bàn để staff chọn
        public List<AssignableTableDTO> Tables { get; set; } = new();
    }
    public class AssignTablesRequestDTO
    {
        public List<int> TableIds { get; set; } = new();
    }
}
