using System.ComponentModel.DataAnnotations;

namespace rmn_be.Core.DTOs
{
    public class PasswordDTO
    {
        public class ForgotPasswordRequestDTO
        {
            [Required]
            [EmailAddress]
            public string Email { get; set; }
        }
        public class ResetPasswordRequestDTO
        {
            [Required]
            [EmailAddress]
            public string Email { get; set; }

            [Required]
            public string Token { get; set; }

            [Required]
            public string NewPassword { get; set; }

            [Required]
            [Compare("NewPassword")]
            public string ConfirmPassword { get; set; }
        }
        public class ChangePasswordRequestDTO
        {
            [Required(ErrorMessage = "Current password is required")]
            public string CurrentPassword { get; set; } = string.Empty;

            [Required(ErrorMessage = "New password is required")]
            public string NewPassword { get; set; } = string.Empty;

            [Required(ErrorMessage = "Confirm password is required")]
            [Compare("NewPassword", ErrorMessage = "Confirm password does not match")]
            public string ConfirmPassword { get; set; } = string.Empty;
        }
    }
}
