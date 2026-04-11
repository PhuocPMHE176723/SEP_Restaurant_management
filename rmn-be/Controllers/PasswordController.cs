using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using rmn_be.Core.Services.Interface;
using SEP_Restaurant_management.Controllers;
using System.Security.Claims;
using static rmn_be.Core.DTOs.PasswordDTO;

namespace rmn_be.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PasswordController : BaseController
    {
        private readonly IPasswordService _passwordResetService;
        public PasswordController(IPasswordService passwordResetService)
        {
            _passwordResetService = passwordResetService;
        }

        [AllowAnonymous]
        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDTO request)
        {
            if (!ModelState.IsValid)
                return Failure("Invalid request data",
                    ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage)).ToList());

            await _passwordResetService.ForgotPasswordAsync(request);

            return Success("If the email exists, a reset link has been sent.");
        }

        [AllowAnonymous]
        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDTO request)
        {
            if (!ModelState.IsValid)
                return Failure("Invalid request data",
                    ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage)).ToList());

            var (succeeded, errors) = await _passwordResetService.ResetPasswordAsync(request);

            if (!succeeded)
                return Failure("Reset password failed", errors);

            return Success("Password reset successfully");
        }

        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDTO request)
        {
            if (!ModelState.IsValid)
            {
                return Failure(
                    "Invalid request data",
                    ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage)).ToList()
                );
            }

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrWhiteSpace(userId))
                return Failure("Cannot get userId from token");

            var (succeeded, errors) = await _passwordResetService.ChangePasswordAsync(userId, request);

            if (!succeeded)
                return Failure("Change password failed", errors);

            return Success("Password changed successfully");
        }
    }
}
