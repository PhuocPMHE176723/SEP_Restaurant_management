using System.ComponentModel.DataAnnotations;

namespace SEP_Restaurant_management.Core.DTOs
{
    // ----- Purchase Receipt DTOs -----
    public class PurchaseReceiptResponse
    {
        public long ReceiptId { get; set; }
        public string ReceiptCode { get; set; } = default!;
        public int? SupplierId { get; set; }
        public DateTime ReceiptDate { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = default!;
        public long? CreatedByStaffId { get; set; }
        public string? CreatedByStaffName { get; set; }
        public string? Note { get; set; }
        public List<PurchaseReceiptItemResponse> Items { get; set; } = new();
    }

    public class PurchaseReceiptItemResponse
    {
        public long ReceiptItemId { get; set; }
        public long ReceiptId { get; set; }
        public long IngredientId { get; set; }
        public string IngredientName { get; set; } = default!;
        public string Unit { get; set; } = default!;
        public decimal Quantity { get; set; }
        public decimal UnitCost { get; set; }
        public decimal LineTotal { get; set; }
    }

    public class CreatePurchaseReceiptRequest
    {
        public int? SupplierId { get; set; }
        public string? Note { get; set; }
        public string Status { get; set; } = "DRAFT"; // DRAFT or RECEIVED
        
        [Required]
        [MinLength(1, ErrorMessage = "Phải có ít nhất 1 mặt hàng")]
        public List<CreatePurchaseReceiptItemRequest> Items { get; set; } = new();
    }

    public class CreatePurchaseReceiptItemRequest
    {
        [Required]
        public long IngredientId { get; set; }
        
        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Số lượng phải lớn hơn 0")]
        public decimal Quantity { get; set; }
        
        [Required]
        [Range(0, double.MaxValue, ErrorMessage = "Đơn giá không được âm")]
        public decimal UnitCost { get; set; }
    }

    public class UpdateReceiptStatusRequest
    {
        [Required]
        [RegularExpression("^(RECEIVED|CANCELLED)$", ErrorMessage = "Trạng thái không hợp lệ")]
        public string Status { get; set; } = default!;
    }

    // ----- Stock Management DTOs -----
    public class InventoryOnHandResponse
    {
        public long IngredientId { get; set; }
        public string IngredientName { get; set; } = default!;
        public string Unit { get; set; } = default!;
        public decimal CurrentStock { get; set; }
        public decimal MaxStock { get; set; } // Total amount ever received (sum of all IN movements)
    }

    public class StockMovementResponse
    {
        public long MovementId { get; set; }
        public long IngredientId { get; set; }
        public string IngredientName { get; set; } = default!;
        public string Unit { get; set; } = default!;
        public string MovementType { get; set; } = default!; // IN / OUT / ADJUST
        public decimal Quantity { get; set; }
        public string? RefType { get; set; } // PURCHASE_RECEIPT, ADJUSTMENT, REASON...
        public long? RefId { get; set; }
        public DateTime MovedAt { get; set; }
        public long? CreatedByStaffId { get; set; }
        public string? CreatedByStaffName { get; set; }
        public string? Note { get; set; }
    }

    public class ManualAdjustmentRequest
    {
        [Required]
        public long IngredientId { get; set; }

        [Required]
        [RegularExpression("^(IN|OUT)$", ErrorMessage = "Loại điều chỉnh phải là IN hoặc OUT")]
        public string MovementType { get; set; } = default!;

        [Required]
        [Range(0.01, double.MaxValue, ErrorMessage = "Số lượng phải lớn hơn 0")]
        public decimal Quantity { get; set; }

        [Required(ErrorMessage = "Lý do điều chỉnh không được để trống")]
        [MaxLength(255)]
        public string Note { get; set; } = default!;
    }
}
