using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Microsoft.IdentityModel.Tokens;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Services.Interface;

namespace SEP_Restaurant_management.Core.Services.Implementation;

public class AuthService : IAuthService
{
    private readonly UserManager<UserIdentity> _userManager;
    private readonly IConfiguration _configuration;
    private readonly SepDatabaseContext _context;

    public AuthService(
        UserManager<UserIdentity> userManager,
        IConfiguration configuration,
        SepDatabaseContext context
    )
    {
        _userManager = userManager;
        _configuration = configuration;
        _context = context;
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
}
