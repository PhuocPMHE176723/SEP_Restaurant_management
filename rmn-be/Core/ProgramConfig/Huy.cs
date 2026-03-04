using SEP_Restaurant_management.Core.Repositories.Implementation;
using SEP_Restaurant_management.Core.Repositories.Interface;
using SEP_Restaurant_management.Core.Services.Implementation;
using SEP_Restaurant_management.Core.Services.Interface;
using SEP_Restaurant_management.Core.Models;

namespace SEP_Restaurant_management.Core.ProgramConfig;

public static class Huy
{
    public static IServiceCollection AddHuyServices(this IServiceCollection services)
    {
        // Register AutoMapper
        services.AddAutoMapper(typeof(Program));

        // Register Repository and Unit of Work
        services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // Register Services
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<IDiningTableService, DiningTableService>();
        services.AddScoped<IMenuCategoryService, MenuCategoryService>();
        services.AddScoped<IMenuItemService, MenuItemService>();
        services.AddScoped<IReservationService, ReservationService>();

        // Register Auth Service (JWT login / register)
        services.AddScoped<IAuthService, AuthService>();

        // Register Email Service
        var configuration = services.BuildServiceProvider().GetRequiredService<IConfiguration>();
        services.Configure<MailSettings>(configuration.GetSection("MailSettings"));
        services.AddTransient<IEmailService, EmailService>();

        // Register Cloudinary Service
        services.AddScoped<ICloudinaryService, CloudinaryService>();

        return services;
    }
}
