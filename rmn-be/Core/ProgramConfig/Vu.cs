

using rmn_be.Core.Services.Implementation;
using rmn_be.Core.Services.Interface;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Repositories.Implementation;
using SEP_Restaurant_management.Core.Repositories.Interface;
using SEP_Restaurant_management.Core.Services.Implementation;
using SEP_Restaurant_management.Core.Services.Interface;

namespace SEP_Restaurant_management.Core.ProgramConfig
{
    public static class Vu
    {
        public static IServiceCollection AddMyServices2(this IServiceCollection services)
        {
            services.AddAutoMapper(typeof(Program));

            services.AddScoped(typeof(IGenericRepository<>), typeof(GenericRepository<>));
            services.AddScoped<IUnitOfWork, UnitOfWork>();

            services.AddScoped<ICategoryService, CategoryService>();
            services.AddScoped<IAuthService, AuthService>();

            // Add new services
            services.AddScoped<IStaffService, StaffService>();
            services.AddScoped<ICustomerService, CustomerService>();
            services.AddScoped<IPasswordService, PasswordService>();

            var configuration = services.BuildServiceProvider().GetRequiredService<IConfiguration>();
            services.Configure<MailSettings>(configuration.GetSection("MailSettings"));
            services.AddTransient<IEmailService, EmailService>();

            return services;

        }
    }
}
