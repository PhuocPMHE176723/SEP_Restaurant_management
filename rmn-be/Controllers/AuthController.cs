using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Services.Interface;

namespace SEP_Restaurant_management.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : BaseController
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    // ─────────────────────────────────────────────
    //  POST /api/auth/login
    // ─────────────────────────────────────────────
    /// <summary>
    /// Đăng nhập và nhận JWT access token.
    /// </summary>
    [AllowAnonymous]
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDTO request)
    {
        if (!ModelState.IsValid)
            return Failure("Invalid request data",
                ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage)).ToList());

        var response = await _authService.LoginAsync(request);

        if (response == null)
            return Unauthorized(new { message = "Invalid email or password." });

        return Success(response, "Login successful");
    }

    // ─────────────────────────────────────────────
    //  POST /api/auth/register
    // ─────────────────────────────────────────────
    /// <summary>
    /// Đăng ký tài khoản mới.
    /// Role cho phép: Admin, Staff, Customer, Warehouse, Kitchen, Cashier.
    /// Mặc định: Customer.
    /// </summary>
    [AllowAnonymous]
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDTO request)
    {
        if (!ModelState.IsValid)
            return Failure("Invalid request data",
                ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage)).ToList());

        var (succeeded, errors) = await _authService.RegisterAsync(request);

        if (!succeeded)
            return Failure("Registration failed", errors);

        return Success("Account registered successfully");
    }

    // ─────────────────────────────────────────────
    //  GET /api/auth/me  (cần token hợp lệ)
    // ─────────────────────────────────────────────
    /// <summary>
    /// Lấy thông tin user đang đăng nhập từ token.
    /// </summary>
    [Authorize]
    [HttpGet("me")]
    public IActionResult GetCurrentUser()
    {
        var claims = User.Claims.Select(c => new { c.Type, c.Value });
        return Success(claims, "Current user info");
    }

    //Forgot password//
    [AllowAnonymous]
    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDTO request)
    {
        if (!ModelState.IsValid)
            return Failure("Invalid request data",
                ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage)).ToList());

        await _authService.ForgotPasswordAsync(request);

        return Success("If the email exists, a reset link has been sent.");
    }

    [AllowAnonymous]
    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDTO request)
    {
        if (!ModelState.IsValid)
            return Failure("Invalid request data",
                ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage)).ToList());

        var (succeeded, errors) = await _authService.ResetPasswordAsync(request);

        if (!succeeded)
            return Failure("Reset password failed", errors);

        return Success("Password reset successfully");
    }

    [AllowAnonymous]
    [HttpPost("registers")]
    public async Task<IActionResult> NewRegister([FromBody] RegisterRequestDTO request)
    {
        if (!ModelState.IsValid)
        {
            return Failure("Invalid request data",
                ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage)).ToList());
        }

        var (succeeded, errors) = await _authService.NewRegisterAsync(request);

        if (!succeeded)
            return Failure("Registration failed", errors);

        return Success("Account registered successfully. Please check your email for OTP.");
    }

    [AllowAnonymous]
    [HttpPost("verify-otp")]
    public async Task<IActionResult> VerifyOtp([FromBody] VerifyEmailOtpRequestDTO request)
    {
        if (!ModelState.IsValid)
        {
            return Failure("Invalid request data",
                ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage)).ToList());
        }

        var (succeeded, errors) = await _authService.VerifyEmailOtpAsync(request);

        if (!succeeded)
            return Failure("Verify OTP failed", errors);

        return Success("Email verified successfully.");
    }

    [AllowAnonymous]
    [HttpPost("resend-otp")]
    public async Task<IActionResult> ResendOtp([FromBody] ResendOtpRequestDTO request)
    {
        if (!ModelState.IsValid)
        {
            return Failure("Invalid request data",
                ModelState.Values.SelectMany(v => v.Errors.Select(e => e.ErrorMessage)).ToList());
        }

        var (succeeded, errors) = await _authService.ResendEmailOtpAsync(request);

        if (!succeeded)
            return Failure("Resend OTP failed", errors);

        return Success("OTP sent successfully.");
    }

}
