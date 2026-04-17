using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.IdentityModel.Tokens;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Services.Interface;

namespace SEP_Restaurant_management.Core.Services.Implementation;

public class AuthService : IAuthService
{
    private readonly UserManager<UserIdentity> _userManager;
    private readonly IConfiguration _configuration;
    private readonly IEmailService _emailService;
    private readonly SepDatabaseContext _context;
    private readonly IMemoryCache _memoryCache;
    private readonly RoleManager<IdentityRole> _roleManager;

    public AuthService(
        UserManager<UserIdentity> userManager,
        IConfiguration configuration,
        SepDatabaseContext context,
        IEmailService emailService,
        IMemoryCache memoryCache,
        RoleManager<IdentityRole> roleManager
    )
    {
        _userManager = userManager;
        _configuration = configuration;
        _context = context;
        _emailService = emailService;
        _memoryCache = memoryCache;
        _roleManager = roleManager;
    }

    // ─────────────────────────────────────────────
    //  LOGIN
    // ─────────────────────────────────────────────
    public async Task<LoginResponseDTO?> LoginAsync(LoginRequestDTO request)
    {
        // 1. Tìm user theo email
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
            return null;

        // 2. Kiểm tra password
        var isPasswordValid = await _userManager.CheckPasswordAsync(user, request.Password);
        if (!isPasswordValid)
            return null;
        if (!user.EmailConfirmed)
        throw new InvalidOperationException("Email chưa được xác thực. Vui lòng nhập OTP.");
        // 3. Lấy danh sách roles
        var roles = (await _userManager.GetRolesAsync(user)).ToList();

        // 4. Tạo JWT token
        var expireMinutes = int.Parse(_configuration["Jwt:ExpireMinutes"] ?? "120");
        var token = GenerateJwtToken(user, roles, expireMinutes);

        // 5. Tính thời gian hết hạn theo giờ Việt Nam (UTC+7)
        TimeZoneInfo vnTimeZone;
        try
        {
            // Windows timezone id
            vnTimeZone = TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time");
        }
        catch (TimeZoneNotFoundException)
        {
            // macOS/Linux typically use IANA ids
            vnTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
        }
        catch (InvalidTimeZoneException)
        {
            vnTimeZone = TimeZoneInfo.FindSystemTimeZoneById("Asia/Ho_Chi_Minh");
        }
        var expiresAtVn = TimeZoneInfo.ConvertTimeFromUtc(
            DateTime.UtcNow.AddMinutes(expireMinutes),
            vnTimeZone
        );

        return new LoginResponseDTO
        {
            AccessToken = token,
            TokenType = "Bearer",
            ExpiresAt = expiresAtVn,
            Email = user.Email!,
            FullName = user.FullName ?? string.Empty,
            PhoneNumber = user.PhoneNumber,
            Roles = roles,
        };
    }

    // ─────────────────────────────────────────────
    //  REGISTER
    // ─────────────────────────────────────────────
    public async Task<(bool Succeeded, List<string> Errors)> RegisterAsync(
        RegisterRequestDTO request
    )
    {
        // Chỉ các role hợp lệ mới được phép đăng ký
        var validRoles = new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "Admin",
            "Staff",
            "Customer",
            "Warehouse",
            "Kitchen",
            "Cashier",
        };

        if (!validRoles.Contains(request.Role))
        {
            return (
                false,
                new List<string>
                {
                    $"Role '{request.Role}' is not valid. Allowed: Admin, Staff, Customer, Warehouse, Kitchen, Cashier.",
                }
            );
        }

        var user = new UserIdentity
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName,
            PhoneNumber = request.Phone,
            EmailConfirmed = true,
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            var errors = result.Errors.Select(e => e.Description).ToList();
            return (false, errors);
        }

        await _userManager.AddToRoleAsync(user, request.Role);

        // Nếu role là Customer, tạo record trong bảng Customer
        if (request.Role.Equals("Customer", StringComparison.OrdinalIgnoreCase))
        {
            var customer = new Customer
            {
                UserId = user.Id,
                FullName = request.FullName,
                Phone = request.Phone,
                Email = request.Email,
                TotalPoints = 0,
                CreatedAt = DateTime.UtcNow,
            };

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();
        }

        return (true, new List<string>());
    }

    // ─────────────────────────────────────────────
    //  JWT TOKEN GENERATION
    // ─────────────────────────────────────────────
    private string GenerateJwtToken(UserIdentity user, IList<string> roles, int expireMinutes)
    {
        var jwtKey =
            _configuration["Jwt:Key"]
            ?? throw new InvalidOperationException("JWT Key is not configured.");
        var issuer = _configuration["Jwt:Issuer"];
        var audience = _configuration["Jwt:Audience"];

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        // Xây dựng claims
        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id),
            new Claim(JwtRegisteredClaimNames.Email, user.Email!),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim(ClaimTypes.Name, user.UserName!),
            new Claim("fullName", user.FullName ?? string.Empty),
        };

        // Add staffId if user is linked to a Staff record
        var staff = _context.Staffs.FirstOrDefault(s => s.UserId == user.Id);
        if (staff != null)
            claims.Add(new Claim("staffId", staff.StaffId.ToString()));

        // Thêm từng role vào claims
        foreach (var role in roles)
        {
            claims.Add(new Claim(ClaimTypes.Role, role));
        }

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expireMinutes),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    //Forgot password//
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

        var resetLink =
            $"{resetPasswordUrl}?email={Uri.EscapeDataString(request.Email)}&token={encodedToken}";

        var subject = "[Nhà Hàng Khói Quê] Yêu cầu đặt lại mật khẩu";

        var htmlMessage =
            $@"
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

        await _emailService.SendEmailNewAsync(request.Email, subject, htmlMessage);
    }

    public async Task<(bool Succeeded, List<string> Errors)> ResetPasswordAsync(
        ResetPasswordRequestDTO request
    )
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

    public async Task<(bool Succeeded, List<string> Errors)> ChangePasswordAsync(
        string userId,
        ChangePasswordRequestDTO request
    )
    {
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return (false, new List<string> { "User not found" });

        var result = await _userManager.ChangePasswordAsync(
            user,
            request.CurrentPassword,
            request.NewPassword
        );

        if (!result.Succeeded)
        {
            return (false, result.Errors.Select(e => e.Description).ToList());
        }

        return (true, new List<string>());
    }

    // Send OTP
    private const int OtpExpiredMinutes = 5;
    private const int ResendCooldownSeconds = 60;

    public async Task<(bool Succeeded, List<string> Errors)> NewRegisterAsync(
        RegisterRequestDTO request
    )
    {
        const string role = "Customer"; // 👉 FIX CỨNG ROLE

        var existingUser = await _userManager.FindByEmailAsync(request.Email);
        if (existingUser != null)
        {
            return (false, new List<string> { "Email is already registered." });
        }

        var roleExists = await _roleManager.RoleExistsAsync(role);
        if (!roleExists)
        {
            return (false, new List<string> { "Customer role does not exist in the system." });
        }

        var user = new UserIdentity
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName,
            PhoneNumber = request.Phone,
            EmailConfirmed = false,
        };

        var createResult = await _userManager.CreateAsync(user, request.Password);

        if (!createResult.Succeeded)
        {
            return (false, createResult.Errors.Select(e => e.Description).ToList());
        }

        var addRoleResult = await _userManager.AddToRoleAsync(user, role);
        if (!addRoleResult.Succeeded)
        {
            await _userManager.DeleteAsync(user);
            return (false, addRoleResult.Errors.Select(e => e.Description).ToList());
        }

        // 👉 tạo Customer profile
        var customer = new Customer
        {
            UserId = user.Id,
            FullName = request.FullName,
            Phone = request.Phone,
            Email = request.Email,
            TotalPoints = 0,
            CreatedAt = DateTime.UtcNow,
        };

        _context.Customers.Add(customer);
        await _context.SaveChangesAsync();

        // 👉 tạo OTP
        var otp = GenerateOtp();

        _memoryCache.Set($"register_otp:{request.Email.ToLower()}", otp, TimeSpan.FromMinutes(5));

        // 👉 gửi mail
        await _emailService.SendEmailVerificationOtpAsync(request.Email, request.FullName, otp);

        return (true, new List<string>());
    }

    public async Task<(bool Succeeded, List<string> Errors)> VerifyEmailOtpAsync(
        VerifyEmailOtpRequestDTO request
    )
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
        {
            return (false, new List<string> { "User not found." });
        }

        if (user.EmailConfirmed)
        {
            return (false, new List<string> { "Email has already been verified." });
        }

        var otpKey = GetOtpKey(request.Email);

        if (
            !_memoryCache.TryGetValue(otpKey, out string? savedOtp)
            || string.IsNullOrWhiteSpace(savedOtp)
        )
        {
            return (false, new List<string> { "OTP expired or not found." });
        }

        if (!string.Equals(savedOtp, request.Otp, StringComparison.Ordinal))
        {
            return (false, new List<string> { "OTP is incorrect." });
        }

        user.EmailConfirmed = true;
        var updateResult = await _userManager.UpdateAsync(user);
        if (!updateResult.Succeeded)
        {
            return (false, updateResult.Errors.Select(e => e.Description).ToList());
        }

        _memoryCache.Remove(otpKey);
        _memoryCache.Remove(GetCooldownKey(request.Email));

        return (true, new List<string>());
    }

    public async Task<(bool Succeeded, List<string> Errors)> ResendEmailOtpAsync(
        ResendOtpRequestDTO request
    )
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user == null)
        {
            return (false, new List<string> { "User not found." });
        }

        if (user.EmailConfirmed)
        {
            return (false, new List<string> { "Email has already been verified." });
        }

        var cooldownKey = GetCooldownKey(request.Email);

        if (_memoryCache.TryGetValue(cooldownKey, out _))
        {
            return (
                false,
                new List<string>
                {
                    $"Please wait {ResendCooldownSeconds} seconds before requesting another OTP.",
                }
            );
        }

        var otp = GenerateOtp();
        SetOtpCache(request.Email, otp);

        _memoryCache.Set(cooldownKey, true, TimeSpan.FromSeconds(ResendCooldownSeconds));

        await _emailService.SendEmailVerificationOtpAsync(
            user.Email ?? request.Email,
            user.FullName ?? user.Email ?? request.Email,
            otp
        );

        return (true, new List<string>());
    }

    private void SetOtpCache(string email, string otp)
    {
        _memoryCache.Set(GetOtpKey(email), otp, TimeSpan.FromMinutes(OtpExpiredMinutes));
    }

    private static string GetOtpKey(string email) => $"register_otp:{email.Trim().ToLower()}";

    private static string GetCooldownKey(string email) =>
        $"register_otp_cooldown:{email.Trim().ToLower()}";

    private static string GenerateOtp()
    {
        var random = new Random();
        return random.Next(100000, 999999).ToString();
    }
}
