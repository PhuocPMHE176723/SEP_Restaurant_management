using Microsoft.AspNetCore.Identity;

namespace SEP_Restaurant_management.Core.Models
{
    public class UserIdentity : IdentityUser
    {
        public string? FullName { get; set; }
        public bool IsPhoneVerified { get; set; } = false;
        public DateTime? PhoneVerifiedAt { get; set; }
        public string? PendingPhoneNumber { get; set; } // Temporarily store new phone awaiting OTP verification
    }
}
