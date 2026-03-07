using System.ComponentModel.DataAnnotations;

namespace SEP_Restaurant_management.Core.DTOs
{
    public class IngredientResponse
    {
        public long IngredientId { get; set; }
        public string IngredientName { get; set; } = default!;
        public string Unit { get; set; } = default!;
        public bool IsActive { get; set; }
    }

    public class CreateIngredientRequest
    {
        [Required(ErrorMessage = "Tên nguyên liệu không được để trống")]
        [MaxLength(150, ErrorMessage = "Tên nguyên liệu không được vượt quá 150 ký tự")]
        public string IngredientName { get; set; } = default!;

        [Required(ErrorMessage = "Đơn vị tính không được để trống")]
        [MaxLength(20, ErrorMessage = "Đơn vị tính không được vượt quá 20 ký tự")]
        public string Unit { get; set; } = default!;
    }

    public class UpdateIngredientRequest
    {
        [MaxLength(150, ErrorMessage = "Tên nguyên liệu không được vượt quá 150 ký tự")]
        public string? IngredientName { get; set; }

        [MaxLength(20, ErrorMessage = "Đơn vị tính không được vượt quá 20 ký tự")]
        public string? Unit { get; set; }

        public bool? IsActive { get; set; }
    }
}
