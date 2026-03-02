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
        
        // Register Email Service
        var configuration = services.BuildServiceProvider().GetRequiredService<IConfiguration>();
        services.Configure<MailSettings>(configuration.GetSection("MailSettings"));
        services.AddTransient<IEmailService, EmailService>();

        return services;
    }
}
