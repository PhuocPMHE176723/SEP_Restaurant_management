using System.ComponentModel.DataAnnotations;

namespace rmn_be.Core.DTOs
{
    public class CustomerDTO
    {
        public long CustomerId { get; set; }
        public string? Username { get; set; }
        public string? UserId { get; set; }
        public string? FullName { get; set; }
        public string? Phone { get; set; }
        public string? Email { get; set; }
        public int TotalPoints { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class CreateCustomerDTO
    {
        [MaxLength(150)]
        public string? FullName { get; set; }

        [MaxLength(20)]
        public string? Phone { get; set; }

        [MaxLength(150)]
        [EmailAddress]
        public string? Email { get; set; }

        [Required]
        [MaxLength(100)]
        public string Username { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string Password { get; set; } = string.Empty;

        [Required]
        [MinLength(6)]
        public string ConfirmPassword { get; set; } = string.Empty;
    }

    public class UpdateCustomerDTO
    {
        [MaxLength(150)]
        public string? FullName { get; set; }

        [MaxLength(20)]
        public string? Phone { get; set; }

        [MaxLength(150)]
        [EmailAddress]
        public string? Email { get; set; }

        [Required]
        [MaxLength(100)]
        public string Username { get; set; } = string.Empty;
    }
}
