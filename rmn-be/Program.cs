using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SEP_Restaurant_management.Core.Data;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.ProgramConfig;

var builder = WebApplication.CreateBuilder(args);

// ─────────────────────────────────────────────────────────────
//  DATABASE
// ─────────────────────────────────────────────────────────────
builder.Services.AddDbContext<SepDatabaseContext>(options =>
{
    options.UseSqlServer(builder.Configuration.GetConnectionString("MyCnn"));
});

// ─────────────────────────────────────────────────────────────
//  IDENTITY
// ─────────────────────────────────────────────────────────────
builder.Services.AddIdentity<UserIdentity, IdentityRole>(options =>
{
    options.Password.RequireDigit = true;
    options.Password.RequiredLength = 6;
    options.Password.RequireUppercase = true;
    options.Password.RequireNonAlphanumeric = true;

    options.User.RequireUniqueEmail = true;
    options.SignIn.RequireConfirmedEmail = false;
})
.AddEntityFrameworkStores<SepDatabaseContext>()
.AddDefaultTokenProviders();

// ─────────────────────────────────────────────────────────────
//  JWT AUTHENTICATION
// ─────────────────────────────────────────────────────────────
var jwtSection = builder.Configuration.GetSection("Jwt");
var jwtKey = jwtSection["Key"]!;
var jwtIssuer = jwtSection["Issuer"]!;
var jwtAudience = jwtSection["Audience"]!;

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
        ClockSkew = TimeSpan.Zero   // Không cho phép trễ thêm thời gian khi kiểm tra token
    };
});

builder.Services.AddAuthorization();

// ─────────────────────────────────────────────────────────────
//  APPLICATION SERVICES
// ─────────────────────────────────────────────────────────────
builder.Services.AddHuyServices();
builder.Services.AddMyServices1();
builder.Services.AddMyServices2();

// Warehouse Services
builder.Services.AddScoped<SEP_Restaurant_management.Core.Services.Interface.IIngredientService, SEP_Restaurant_management.Core.Services.Implementation.IngredientService>();
builder.Services.AddScoped<SEP_Restaurant_management.Core.Services.Interface.IPurchaseReceiptService, SEP_Restaurant_management.Core.Services.Implementation.PurchaseReceiptService>();
builder.Services.AddScoped<SEP_Restaurant_management.Core.Services.Interface.IStockService, SEP_Restaurant_management.Core.Services.Implementation.StockService>();

// Promotion & Loyalty Services
builder.Services.AddScoped<SEP_Restaurant_management.Core.Services.Interface.IPromotionService, SEP_Restaurant_management.Core.Services.Implementation.PromotionService>();

// ─────────────────────────────────────────────────────────────
//  CORS
// ─────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.SetIsOriginAllowed(origin => true) // Allow any origin
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials() // Allow credentials for cookies if needed
    );
});

// ─────────────────────────────────────────────────────────────
//  SWAGGER – hỗ trợ Authorize bằng Bearer token
// ─────────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Restaurant Management API",
        Version = "v1"
    });

    // Thêm nút Authorize trong Swagger UI
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Nhập JWT token theo dạng: Bearer {your_token}"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddControllers();

// ─────────────────────────────────────────────────────────────
//  BUILD
// ─────────────────────────────────────────────────────────────
var app = builder.Build();

// ─────────────────────────────────────────────────────────────
//  SEED DATABASE
// ─────────────────────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        await DbInitializer.Initialize(services);
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "An error occurred while seeding the database.");
    }

    // One-time schema patch: make CreatedByStaffId nullable (in case EF migration not applied)
    try
    {
        var ctx = services.GetRequiredService<SepDatabaseContext>();
        ctx.Database.ExecuteSqlRaw(@"
            IF EXISTS (
                SELECT 1 FROM sys.columns
                WHERE object_id = OBJECT_ID('PurchaseReceipts')
                  AND name = 'CreatedByStaffId' AND is_nullable = 0
            ) ALTER TABLE [PurchaseReceipts] ALTER COLUMN [CreatedByStaffId] BIGINT NULL");
    }
    catch { /* ignore if already nullable or table doesn't exist */ }
}

// ─────────────────────────────────────────────────────────────
//  MIDDLEWARE PIPELINE
// ─────────────────────────────────────────────────────────────
app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();    // Phải đứng TRƯỚC UseAuthorization
app.UseAuthorization();
app.MapControllers();

app.Run();
