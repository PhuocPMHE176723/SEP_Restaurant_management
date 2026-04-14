using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using rmn_be.Core.Services.Interface;
using SEP_Restaurant_management.Controllers;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Services.Interface;
using System.Security.Claims;

namespace rmn_be.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProfileController : BaseController
    {
        private readonly ICustomerService _customerService;
        private readonly IStaffService _staffService;
        private readonly IAuthService _authService;
        public ProfileController(ICustomerService customerService, IStaffService staffService, IAuthService authService)
        {
            _customerService = customerService;
            _staffService = staffService;
            _authService = authService;
        }
        [HttpGet("staff/me")]
        public async Task<IActionResult> GetMyProfile()
        {
            var authHeader = Request.Headers["Authorization"].FirstOrDefault();
            Console.WriteLine($"Authorization: {authHeader}");
            Console.WriteLine($"IsAuthenticated: {User.Identity?.IsAuthenticated}");

            foreach (var claim in User.Claims)
            {
                Console.WriteLine($"{claim.Type} = {claim.Value}");
            }
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
                return Failure("Cannot get userId from token");

            var staff = await _staffService.GetMyProfileAsync(userId);
            foreach (var claim in User.Claims)
            {
                Console.WriteLine($"{claim.Type} = {claim.Value}");
            }
            if (staff == null)
                return Failure("Staff profile not found");

            return Success(staff);
        }

        [HttpGet("customers/me")]
        public async Task<IActionResult> GetCustomerProfile()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(userId))
                return Failure("Cannot get userId from token");

            var customer = await _customerService.GetMyProfileAsync(userId);
            foreach (var claim in User.Claims)
            {
                Console.WriteLine($"{claim.Type} = {claim.Value}");
            }
            if (customer == null)
                return Failure("Customer profile not found");

            return Success(customer);
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

            var (succeeded, errors) = await _authService.ChangePasswordAsync(userId, request);

            if (!succeeded)
                return Failure("Change password failed", errors);

            return Success("Password changed successfully");
        }

        [HttpGet("myOrder")]
        public async Task<IActionResult> GetMyContext()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "User ID not found in token" });

            var result = await _customerService.GetMyOrderAsync(userId);
            return Success(result, "Customer context fetched successfully");
        }
    }
}
