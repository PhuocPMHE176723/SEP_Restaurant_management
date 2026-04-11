using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using rmn_be.Core.DTOs;
using rmn_be.Core.Services.Interface;
using SEP_Restaurant_management.Controllers;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Repositories.Interface;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace rmn_be.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : BaseController
    {
        private readonly ICustomerService _customerService;
        private readonly IStaffService _staffService;
        public UserController(ICustomerService customerService, IStaffService staffService)
        {
            _customerService = customerService;
            _staffService = staffService;
        }

        // ========================= STAFF =========================

        [HttpGet("staff")]
        public async Task<IActionResult> GetAllStaff([FromQuery] PagingRequestDTO pagingRequest)
        {
            var staffs = await _staffService.GetAllStaffAsync(pagingRequest);
            return Success(staffs);
        }

        [HttpGet("staff/{id:long}")]
        public async Task<IActionResult> GetStaffById(long id)
        {
            var staff = await _staffService.GetStaffByIdAsync(id);
            if (staff == null)
                return NotFoundResponse($"Staff with ID {id} not found");

            return Success(staff);
        }

        [HttpPost("staff")]
        public async Task<IActionResult> CreateStaff([FromBody] CreateStaffDTO createDto)
        {
            if (!ModelState.IsValid)
            {
                return Failure(
                    "Invalid request data",
                    ModelState.Values
                        .SelectMany(v => v.Errors.Select(e => e.ErrorMessage))
                        .ToList()
                );
            }

            try
            {
                var result = await _staffService.CreateStaffAsync(createDto);
                return Success(result, "Staff created successfully");
            }
            catch (Exception ex)
            {
                return Failure(ex.Message);
            }
        }

        [HttpPut("staff/{id:long}")]
        public async Task<IActionResult> UpdateStaff(long id, [FromBody] UpdateStaffDTO updateDto)
        {
            if (!ModelState.IsValid)
            {
                return Failure(
                    "Invalid request data",
                    ModelState.Values
                        .SelectMany(v => v.Errors.Select(e => e.ErrorMessage))
                        .ToList()
                );
            }

            try
            {
                var updated = await _staffService.UpdateStaffAsync(id, updateDto);
                if (!updated)
                    return NotFoundResponse($"Staff with ID {id} not found");

                return Success("Staff updated successfully");
            }
            catch (Exception ex)
            {
                return Failure(ex.Message);
            }
        }

        [HttpPut("staff/{id}/lock")]
        public async Task<IActionResult> LockStaffAccount(long id)
        {
            var result = await _staffService.LockStaffAccountAsync(id);
            if (!result)
                return NotFoundResponse($"Staff with ID {id} not found");

            return Success("Staff account locked successfully");
        }

        [HttpPut("staff/{id}/unlock")]
        public async Task<IActionResult> UnlockStaffAccount(long id)
        {
            var result = await _staffService.UnlockStaffAccountAsync(id);
            if (!result)
                return NotFoundResponse($"Staff with ID {id} not found");

            return Success("Staff account unlocked successfully");
        }

        [HttpGet("staff/me")]
        public async Task<IActionResult> GetMyProfile()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

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

        // ========================= CUSTOMER =========================

        [HttpGet("customers")]
        public async Task<IActionResult> GetAllCustomers([FromQuery] PagingRequestDTO pagingRequest)
        {
            var customers = await _customerService.GetAllCustomersAsync(pagingRequest);
            return Success(customers);
        }

        [HttpGet("customers/{id:long}")]
        public async Task<IActionResult> GetCustomerById(long id)
        {
            var customer = await _customerService.GetCustomerByIdAsync(id);
            if (customer == null)
                return NotFoundResponse($"Customer with ID {id} not found");

            return Success(customer);
        }
        [HttpPost("customers/register")]
        public async Task<IActionResult> Register([FromBody] CreateCustomerDTO registerDto)
        {
            if (!ModelState.IsValid)
            {
                return Failure(
                    "Invalid request data",
                    ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage)).ToList()
                );
            }

            try
            {
                var result = await _customerService.CreateCustomerAsync(registerDto);
                return Success(result, "Customer registered successfully");
            }
            catch (Exception ex)
            {
                return Failure(ex.Message);
            }
        }

        [HttpPut("customers/{id}")]
        public async Task<IActionResult> UpdateCustomer(long id, [FromBody] UpdateCustomerDTO updateDto)
        {
            if (!ModelState.IsValid)
            {
                return Failure(
                    "Invalid request data",
                    ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage)).ToList()
                );
            }

            try
            {
                var updated = await _customerService.UpdateCustomerAsync(id, updateDto);
                if (!updated)
                    return NotFoundResponse($"Customer with ID {id} not found");

                return Success("Customer updated successfully");
            }
            catch (Exception ex)
            {
                return Failure(ex.Message);
            }
        }

        [HttpGet("customers/me")]
        public async Task<IActionResult> GetCustomerProfile()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

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
        [HttpGet("me/context")]
        public async Task<IActionResult> GetMyContext()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
                return Unauthorized(new { message = "User ID not found in token" });

            var result = await _customerService.GetMyContextAsync(userId);
            return Success(result, "Customer context fetched successfully");
        }
    }
}
