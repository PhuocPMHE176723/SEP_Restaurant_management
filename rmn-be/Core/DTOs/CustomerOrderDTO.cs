using SEP_Restaurant_management.Core.DTOs;

namespace rmn_be.Core.DTOs
{
    public class CustomerOrderDTO
    {
       

        public class CustomerContextDTO
        {
            public string DisplayMode { get; set; } = "NONE";
            public CustomerSummaryDTO? Customer { get; set; }
            public OrderDTO? ActiveOrder { get; set; }
            public ReservationDTO? ActiveReservation { get; set; }
        }

        public class CustomerSummaryDTO
        {
            public long CustomerId { get; set; }
            public string? FullName { get; set; }
            public string? Phone { get; set; }
            public string? Email { get; set; }
            public int TotalPoints { get; set; }
        }
        public class OrderItemCDTO
        {
            public long OrderItemId { get; set; }
            public string MenuItemName { get; set; } = default!;
            public int Quantity { get; set; }
            public decimal UnitPrice { get; set; }
            public string? Note { get; set; }

            public string? Status { get; set; }
        }
        public class ReservationCDTO
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
            public decimal DepositAmount { get; set; }
            public OrderDTO? Order { get; set; }
        }
    }
}
