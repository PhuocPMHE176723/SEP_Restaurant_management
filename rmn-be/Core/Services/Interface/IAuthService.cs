using SEP_Restaurant_management.Core.DTOs;

namespace SEP_Restaurant_management.Core.Services.Interface;

public interface IAuthService
{
    /// <summary>
    /// Đăng nhập và trả về JWT token nếu thành công
    /// </summary>
    Task<LoginResponseDTO?> LoginAsync(LoginRequestDTO request);

    /// <summary>
    /// Đăng ký tài khoản mới
    /// </summary>
    Task<(bool Succeeded, List<string> Errors)> RegisterAsync(RegisterRequestDTO request);

    /// Forgot password
    Task ForgotPasswordAsync(ForgotPasswordRequestDTO request);
    Task<(bool Succeeded, List<string> Errors)> ResetPasswordAsync(ResetPasswordRequestDTO request);
    Task<(bool Succeeded, List<string> Errors)> ChangePasswordAsync(string userId, ChangePasswordRequestDTO request);

    Task<(bool Succeeded, List<string> Errors)> NewRegisterAsync(RegisterRequestDTO request);
    Task<(bool Succeeded, List<string> Errors)> VerifyEmailOtpAsync(VerifyEmailOtpRequestDTO request);
    Task<(bool Succeeded, List<string> Errors)> ResendEmailOtpAsync(ResendOtpRequestDTO request);
}
