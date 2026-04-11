using static rmn_be.Core.DTOs.PasswordDTO;

namespace rmn_be.Core.Services.Interface
{
    public interface IPasswordService
    {
        Task ForgotPasswordAsync(ForgotPasswordRequestDTO request);
        Task<(bool Succeeded, List<string> Errors)> ResetPasswordAsync(ResetPasswordRequestDTO request);
        Task<(bool Succeeded, List<string> Errors)> ChangePasswordAsync(string userId, ChangePasswordRequestDTO request);
    }
}
