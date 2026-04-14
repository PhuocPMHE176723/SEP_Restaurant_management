using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Moq;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Services.Implementation;
using Microsoft.Extensions.Caching.Memory;
using SEP_Restaurant_management.Core.Services.Interface;
using Xunit;

namespace rmn_be.Tests;

public class AuthServicePostTests
{
    private static SepDatabaseContext CreateContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<SepDatabaseContext>()
            .UseInMemoryDatabase(dbName)
            .Options;

        var context = new SepDatabaseContext(options);
        context.Database.EnsureCreated();
        return context;
    }

    private static IConfiguration CreateJwtConfig(int expireMinutes = 120)
    {
        var settings = new Dictionary<string, string?>
        {
            ["Jwt:Key"] = "super_secret_test_key_1234567890",
            ["Jwt:Issuer"] = "test-issuer",
            ["Jwt:Audience"] = "test-audience",
            ["Jwt:ExpireMinutes"] = expireMinutes.ToString(),
        };

        return new ConfigurationBuilder().AddInMemoryCollection(settings).Build();
    }

    private static Mock<UserManager<UserIdentity>> CreateUserManagerMock()
    {
        var store = new Mock<IUserStore<UserIdentity>>();
        return new Mock<UserManager<UserIdentity>>(
            store.Object,
            null!,
            null!,
            null!,
            null!,
            null!,
            null!,
            null!,
            null!
        );
    }

    private static Mock<RoleManager<IdentityRole>> CreateRoleManagerMock()
    {
        var store = new Mock<IRoleStore<IdentityRole>>();
        return new Mock<RoleManager<IdentityRole>>(
            store.Object,
            null!,
            null!,
            null!,
            null!
        );
    }

    private static JwtSecurityToken ReadJwt(string token)
    {
        var handler = new JwtSecurityTokenHandler();
        return handler.ReadJwtToken(token);
    }

    // ─────────────────────────────────────────────
    //  FUNC: LoginAsync (5 testcases)
    // ─────────────────────────────────────────────

    [Fact]
    [Trait("CodeModule", "Auth")]
    [Trait("Method", "LoginAsync")]
    [Trait("UTCID", "UTCID01")]
    [Trait("Type", "N")]
    public async Task UTCID01_LoginAsync_ValidCredentials_ReturnsTokenAndRoles()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        var user = new UserIdentity
        {
            Id = "U1",
            Email = "a@b.com",
            UserName = "a@b.com",
            FullName = "Alice",
            PhoneNumber = "123",
        };

        var um = CreateUserManagerMock();
        um.Setup(x => x.FindByEmailAsync("a@b.com")).ReturnsAsync(user);
        um.Setup(x => x.CheckPasswordAsync(user, "pw")).ReturnsAsync(true);
        um.Setup(x => x.GetRolesAsync(user)).ReturnsAsync(new List<string> { "Customer" });

        var emailMock = new Mock<IEmailService>();
        var cacheMock = new Mock<IMemoryCache>();
        var roleMock = CreateRoleManagerMock();
        var service = new AuthService(um.Object, CreateJwtConfig(expireMinutes: 10), context, emailMock.Object, cacheMock.Object, roleMock.Object);

        var resp = await service.LoginAsync(
            new LoginRequestDTO { Email = "a@b.com", Password = "pw" }
        );

        Assert.NotNull(resp);
        Assert.Equal("Bearer", resp!.TokenType);
        Assert.Equal("a@b.com", resp.Email);
        Assert.Equal("Alice", resp.FullName);
        Assert.Single(resp.Roles);
        Assert.Equal("Customer", resp.Roles[0]);
        Assert.False(string.IsNullOrWhiteSpace(resp.AccessToken));

        var jwt = ReadJwt(resp.AccessToken);
        Assert.Contains(
            jwt.Claims,
            c => c.Type == JwtRegisteredClaimNames.Email && c.Value == "a@b.com"
        );
        Assert.Contains(jwt.Claims, c => c.Type == "fullName" && c.Value == "Alice");
        Assert.Contains(jwt.Claims, c => c.Type == ClaimTypes.Role && c.Value == "Customer");
    }

    [Fact]
    [Trait("CodeModule", "Auth")]
    [Trait("Method", "LoginAsync")]
    [Trait("UTCID", "UTCID02")]
    [Trait("Type", "A")]
    public async Task UTCID02_LoginAsync_UserNotFound_ReturnsNull()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        var um = CreateUserManagerMock();
        um.Setup(x => x.FindByEmailAsync("missing@b.com")).ReturnsAsync((UserIdentity?)null);

        var emailMock = new Mock<IEmailService>();
        var cacheMock = new Mock<IMemoryCache>();
        var roleMock = CreateRoleManagerMock();
        var service = new AuthService(um.Object, CreateJwtConfig(), context, emailMock.Object, cacheMock.Object, roleMock.Object);

        var resp = await service.LoginAsync(
            new LoginRequestDTO { Email = "missing@b.com", Password = "pw" }
        );

        Assert.Null(resp);
    }

    [Fact]
    [Trait("CodeModule", "Auth")]
    [Trait("Method", "LoginAsync")]
    [Trait("UTCID", "UTCID03")]
    [Trait("Type", "A")]
    public async Task UTCID03_LoginAsync_InvalidPassword_ReturnsNull()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        var user = new UserIdentity
        {
            Id = "U1",
            Email = "a@b.com",
            UserName = "a@b.com",
        };

        var um = CreateUserManagerMock();
        um.Setup(x => x.FindByEmailAsync("a@b.com")).ReturnsAsync(user);
        um.Setup(x => x.CheckPasswordAsync(user, "wrong")).ReturnsAsync(false);

        var emailMock = new Mock<IEmailService>();
        var cacheMock = new Mock<IMemoryCache>();
        var roleMock = CreateRoleManagerMock();
        var service = new AuthService(um.Object, CreateJwtConfig(), context, emailMock.Object, cacheMock.Object, roleMock.Object);

        var resp = await service.LoginAsync(
            new LoginRequestDTO { Email = "a@b.com", Password = "wrong" }
        );

        Assert.Null(resp);
    }

    [Fact]
    [Trait("CodeModule", "Auth")]
    [Trait("Method", "LoginAsync")]
    [Trait("UTCID", "UTCID04")]
    [Trait("Type", "B")]
    public async Task UTCID04_LoginAsync_NoRoles_ReturnsTokenWithEmptyRoles()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        var user = new UserIdentity
        {
            Id = "U1",
            Email = "a@b.com",
            UserName = "a@b.com",
        };

        var um = CreateUserManagerMock();
        um.Setup(x => x.FindByEmailAsync("a@b.com")).ReturnsAsync(user);
        um.Setup(x => x.CheckPasswordAsync(user, "pw")).ReturnsAsync(true);
        um.Setup(x => x.GetRolesAsync(user)).ReturnsAsync(new List<string>());

        var emailMock = new Mock<IEmailService>();
        var cacheMock = new Mock<IMemoryCache>();
        var roleMock = CreateRoleManagerMock();
        var service = new AuthService(um.Object, CreateJwtConfig(), context, emailMock.Object, cacheMock.Object, roleMock.Object);

        var resp = await service.LoginAsync(
            new LoginRequestDTO { Email = "a@b.com", Password = "pw" }
        );

        Assert.NotNull(resp);
        Assert.Empty(resp!.Roles);
        Assert.False(string.IsNullOrWhiteSpace(resp.AccessToken));
    }

    [Fact]
    [Trait("CodeModule", "Auth")]
    [Trait("Method", "LoginAsync")]
    [Trait("UTCID", "UTCID05")]
    [Trait("Type", "B")]
    public async Task UTCID05_LoginAsync_UserHasStaffRecord_AddsStaffIdClaim()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        var user = new UserIdentity
        {
            Id = "U_STAFF",
            Email = "s@b.com",
            UserName = "s@b.com",
        };
        context.Staffs.Add(
            new Staff
            {
                StaffId = 5,
                StaffCode = "S001",
                FullName = "Staff",
                UserId = "U_STAFF",
                CreatedAt = DateTime.UtcNow,
            }
        );
        await context.SaveChangesAsync();

        var um = CreateUserManagerMock();
        um.Setup(x => x.FindByEmailAsync("s@b.com")).ReturnsAsync(user);
        um.Setup(x => x.CheckPasswordAsync(user, "pw")).ReturnsAsync(true);
        um.Setup(x => x.GetRolesAsync(user)).ReturnsAsync(new List<string> { "Staff" });

        var emailMock = new Mock<IEmailService>();
        var cacheMock = new Mock<IMemoryCache>();
        var roleMock = CreateRoleManagerMock();
        var service = new AuthService(um.Object, CreateJwtConfig(), context, emailMock.Object, cacheMock.Object, roleMock.Object);

        var resp = await service.LoginAsync(
            new LoginRequestDTO { Email = "s@b.com", Password = "pw" }
        );

        var jwt = ReadJwt(resp!.AccessToken);
        Assert.Contains(jwt.Claims, c => c.Type == "staffId" && c.Value == "5");
    }

    // ─────────────────────────────────────────────
    //  FUNC: RegisterAsync (5 testcases)
    // ─────────────────────────────────────────────

    [Fact]
    [Trait("CodeModule", "Auth")]
    [Trait("Method", "RegisterAsync")]
    [Trait("UTCID", "UTCID01")]
    [Trait("Type", "N")]
    public async Task UTCID01_RegisterAsync_CustomerRole_CreatesCustomerRecord_ReturnsSuccess()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        var um = CreateUserManagerMock();
        um.Setup(x => x.CreateAsync(It.IsAny<UserIdentity>(), It.IsAny<string>()))
            .Callback<UserIdentity, string>((u, _) => u.Id = "NEW_USER")
            .ReturnsAsync(IdentityResult.Success);
        um.Setup(x => x.AddToRoleAsync(It.IsAny<UserIdentity>(), "Customer"))
            .ReturnsAsync(IdentityResult.Success);

        var emailMock = new Mock<IEmailService>();
        var cacheMock = new Mock<IMemoryCache>();
        var roleMock = CreateRoleManagerMock();
        var service = new AuthService(um.Object, CreateJwtConfig(), context, emailMock.Object, cacheMock.Object, roleMock.Object);

        var (ok, errors) = await service.RegisterAsync(
            new RegisterRequestDTO
            {
                Email = "c@b.com",
                Password = "pw",
                FullName = "Customer",
                Phone = "999",
                Role = "Customer",
            }
        );

        Assert.True(ok);
        Assert.Empty(errors);
        Assert.Equal(1, await context.Customers.CountAsync());
        var customer = await context.Customers.SingleAsync();
        Assert.Equal("NEW_USER", customer.UserId);
        Assert.Equal("c@b.com", customer.Email);
        Assert.Equal("Customer", customer.FullName);
    }

    [Fact]
    [Trait("CodeModule", "Auth")]
    [Trait("Method", "RegisterAsync")]
    [Trait("UTCID", "UTCID02")]
    [Trait("Type", "A")]
    public async Task UTCID02_RegisterAsync_InvalidRole_ReturnsFailure_DoesNotCreateUser()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        var um = CreateUserManagerMock();

        var emailMock = new Mock<IEmailService>();
        var cacheMock = new Mock<IMemoryCache>();
        var roleMock = CreateRoleManagerMock();
        var service = new AuthService(um.Object, CreateJwtConfig(), context, emailMock.Object, cacheMock.Object, roleMock.Object);

        var (ok, errors) = await service.RegisterAsync(
            new RegisterRequestDTO
            {
                Email = "x@b.com",
                Password = "pw",
                FullName = "X",
                Phone = "1",
                Role = "Hacker",
            }
        );

        Assert.False(ok);
        Assert.NotEmpty(errors);
        um.Verify(x => x.CreateAsync(It.IsAny<UserIdentity>(), It.IsAny<string>()), Times.Never);
        Assert.Equal(0, await context.Customers.CountAsync());
    }

    [Fact]
    [Trait("CodeModule", "Auth")]
    [Trait("Method", "RegisterAsync")]
    [Trait("UTCID", "UTCID03")]
    [Trait("Type", "A")]
    public async Task UTCID03_RegisterAsync_CreateFails_ReturnsFailureAndErrors()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        var um = CreateUserManagerMock();
        um.Setup(x => x.CreateAsync(It.IsAny<UserIdentity>(), It.IsAny<string>()))
            .ReturnsAsync(
                IdentityResult.Failed(new IdentityError { Description = "Create failed" })
            );

        var emailMock = new Mock<IEmailService>();
        var cacheMock = new Mock<IMemoryCache>();
        var roleMock = CreateRoleManagerMock();
        var service = new AuthService(um.Object, CreateJwtConfig(), context, emailMock.Object, cacheMock.Object, roleMock.Object);

        var (ok, errors) = await service.RegisterAsync(
            new RegisterRequestDTO
            {
                Email = "c@b.com",
                Password = "pw",
                FullName = "Customer",
                Phone = "999",
                Role = "Customer",
            }
        );

        Assert.False(ok);
        Assert.Contains(errors, e => e.Contains("Create failed"));
        Assert.Equal(0, await context.Customers.CountAsync());
        um.Verify(x => x.AddToRoleAsync(It.IsAny<UserIdentity>(), It.IsAny<string>()), Times.Never);
    }

    [Fact]
    [Trait("CodeModule", "Auth")]
    [Trait("Method", "RegisterAsync")]
    [Trait("UTCID", "UTCID04")]
    [Trait("Type", "B")]
    public async Task UTCID04_RegisterAsync_StaffRole_DoesNotCreateCustomerRecord()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        var um = CreateUserManagerMock();
        um.Setup(x => x.CreateAsync(It.IsAny<UserIdentity>(), It.IsAny<string>()))
            .Callback<UserIdentity, string>((u, _) => u.Id = "NEW_USER")
            .ReturnsAsync(IdentityResult.Success);
        um.Setup(x => x.AddToRoleAsync(It.IsAny<UserIdentity>(), "Staff"))
            .ReturnsAsync(IdentityResult.Success);

        var emailMock = new Mock<IEmailService>();
        var cacheMock = new Mock<IMemoryCache>();
        var roleMock = CreateRoleManagerMock();
        var service = new AuthService(um.Object, CreateJwtConfig(), context, emailMock.Object, cacheMock.Object, roleMock.Object);

        var (ok, _) = await service.RegisterAsync(
            new RegisterRequestDTO
            {
                Email = "s@b.com",
                Password = "pw",
                FullName = "Staff",
                Phone = "111",
                Role = "Staff",
            }
        );

        Assert.True(ok);
        Assert.Equal(0, await context.Customers.CountAsync());
    }

    [Fact]
    [Trait("CodeModule", "Auth")]
    [Trait("Method", "RegisterAsync")]
    [Trait("UTCID", "UTCID05")]
    [Trait("Type", "B")]
    public async Task UTCID05_RegisterAsync_CustomerRole_CaseInsensitive_CreatesCustomerRecord()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        var um = CreateUserManagerMock();
        um.Setup(x => x.CreateAsync(It.IsAny<UserIdentity>(), It.IsAny<string>()))
            .Callback<UserIdentity, string>((u, _) => u.Id = "NEW_USER")
            .ReturnsAsync(IdentityResult.Success);
        um.Setup(x => x.AddToRoleAsync(It.IsAny<UserIdentity>(), "customer"))
            .ReturnsAsync(IdentityResult.Success);

        var emailMock = new Mock<IEmailService>();
        var cacheMock = new Mock<IMemoryCache>();
        var roleMock = CreateRoleManagerMock();
        var service = new AuthService(um.Object, CreateJwtConfig(), context, emailMock.Object, cacheMock.Object, roleMock.Object);

        var (ok, errors) = await service.RegisterAsync(
            new RegisterRequestDTO
            {
                Email = "c2@b.com",
                Password = "pw",
                FullName = "Customer2",
                Phone = "222",
                Role = "customer",
            }
        );

        Assert.True(ok);
        Assert.Empty(errors);
        Assert.Equal(1, await context.Customers.CountAsync());
    }
}
