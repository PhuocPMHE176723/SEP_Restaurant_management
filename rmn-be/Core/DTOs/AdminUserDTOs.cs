using System.ComponentModel.DataAnnotations;

namespace SEP_Restaurant_management.Core.DTOs;

public class UserListResponse
{
    public string Id { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string FullName { get; set; } = default!;
    public string? PhoneNumber { get; set; }
    public bool IsActive { get; set; }
    public List<string> Roles { get; set; } = new();
    public DateTime CreatedAt { get; set; }
}

public class CreateUserRequest
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = default!;

    [Required]
    [StringLength(50)]
    public string FullName { get; set; } = default!;

    [Required]
    [StringLength(100, MinimumLength = 6)]
    public string Password { get; set; } = default!;

    [Phone]
    public string? PhoneNumber { get; set; }

    [Required]
    public List<string> Roles { get; set; } = new();
}

public class UpdateUserRequest
{
    [StringLength(50)]
    public string? FullName { get; set; }

    [Phone]
    public string? PhoneNumber { get; set; }

    public bool? IsActive { get; set; }

    public List<string>? Roles { get; set; }
}

public class ResetPasswordRequest
{
    [Required]
    [StringLength(100, MinimumLength = 6)]
    public string NewPassword { get; set; } = default!;
}

public class UserDetailResponse
{
    public string Id { get; set; } = default!;
    public string Email { get; set; } = default!;
    public string FullName { get; set; } = default!;
    public string? PhoneNumber { get; set; }
    public bool IsActive { get; set; }
    public List<string> Roles { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }
}

public class RoleAssignmentRequest
{
    [Required]
    public List<string> Roles { get; set; } = new();
}
