using System.ComponentModel.DataAnnotations;

namespace rmn_be.Core.DTOs
{
    public class StaffDTO
    {
        public long StaffId { get; set; }
        public string? Username { get; set; }
        public string UserId { get; set; } = string.Empty;
        public string StaffCode { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public string? Position { get; set; }
        public DateOnly? HireDate { get; set; }
        public string WorkingStatus { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }

    public class CreateStaffDTO
    {

        [Required]
        [MaxLength(150)]
        public string FullName { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? Phone { get; set; }

        [MaxLength(150)]
        [EmailAddress]
        public string? Email { get; set; }

        [MaxLength(50)]
        public string? Position { get; set; }

    }

    public class UpdateStaffDTO
    {
        [Required]
        [MaxLength(150)]
        public string FullName { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? Phone { get; set; }

        [MaxLength(150)]
        [EmailAddress]
        public string? Email { get; set; }

        [MaxLength(50)]
        public string? Position { get; set; }


        [MaxLength(20)]
        public string WorkingStatus { get; set; } = "ACTIVE";
    }
}
