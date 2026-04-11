using Microsoft.AspNetCore.Identity;
using rmn_be.Core.Services.Interface;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Services.Interface;
using static rmn_be.Core.DTOs.PasswordDTO;

namespace rmn_be.Core.Services.Implementation
{
    public class PasswordService : IPasswordService
    {
        private readonly UserManager<UserIdentity> _userManager;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;

        public PasswordService(
            UserManager<UserIdentity> userManager,
            IEmailService emailService,
            IConfiguration configuration)
        {
            _userManager = userManager;
            _emailService = emailService;
            _configuration = configuration;
        }

        public async Task ForgotPasswordAsync(ForgotPasswordRequestDTO request)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);

            // Không leak thông tin email có tồn tại hay không
            if (user == null)
                return;

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);
            var encodedToken = Uri.EscapeDataString(token);

            var resetPasswordUrl = _configuration["Frontend:ResetPasswordUrl"];
            if (string.IsNullOrWhiteSpace(resetPasswordUrl))
                throw new InvalidOperationException("Frontend:ResetPasswordUrl is not configured.");

            var resetLink = $"{resetPasswordUrl}?email={Uri.EscapeDataString(request.Email)}&token={encodedToken}";

            var subject = "[Nhà Hàng Khói Quê] Yêu cầu đặt lại mật khẩu";

            var htmlMessage = $@"
            <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;'>
                <div style='background-color: #f7a048; padding: 20px; text-align: center; color: white;'>
                    <h2 style='margin: 0;'>Đặt Lại Mật Khẩu</h2>
                </div>
                <div style='padding: 20px; color: #333; line-height: 1.6;'>
                    <p>Xin chào,</p>
                    <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản <strong>{request.Email}</strong>.</p>
                    <p>Vui lòng nhấn vào nút bên dưới để đặt lại mật khẩu:</p>
                    <p style='text-align: center; margin: 24px 0;'>
                        <a href='{resetLink}'
                           style='background-color: #f7a048; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;'>
                            Đặt lại mật khẩu
                        </a>
                    </p>
                    <p>Nếu bạn không yêu cầu thao tác này, bạn có thể bỏ qua email.</p>
                    <p style='background-color: #fff4e5; padding: 10px; border-left: 4px solid #f7a048; font-size: 14px; margin-top: 20px;'>
                        <strong>Lưu ý:</strong> Liên kết này chỉ có hiệu lực trong một khoảng thời gian giới hạn.
                    </p>
                </div>
                <div style='background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #888;'>
                    <p style='margin: 0;'>Nhà Hàng Khói Quê</p>
                </div>
            </div>";

            await _emailService.SendEmailAsync(request.Email, subject, htmlMessage);
        }

        public async Task<(bool Succeeded, List<string> Errors)> ResetPasswordAsync(ResetPasswordRequestDTO request)
        {
            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
                return (false, new List<string> { "User not found." });

            var decodedToken = Uri.UnescapeDataString(request.Token);

            var result = await _userManager.ResetPasswordAsync(user, decodedToken, request.NewPassword);

            if (!result.Succeeded)
                return (false, result.Errors.Select(x => x.Description).ToList());

            return (true, new List<string>());
        }

        public async Task<(bool Succeeded, List<string> Errors)> ChangePasswordAsync(string userId, ChangePasswordRequestDTO request)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return (false, new List<string> { "User not found" });

            var result = await _userManager.ChangePasswordAsync(user, request.CurrentPassword, request.NewPassword);

            if (!result.Succeeded)
            {
                return (false, result.Errors.Select(e => e.Description).ToList());
            }

            return (true, new List<string>());
        }
    }
}
