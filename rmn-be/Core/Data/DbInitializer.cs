using Microsoft.AspNetCore.Identity;
using SEP_Restaurant_management.Core.Models;

namespace SEP_Restaurant_management.Core.Data;

public static class DbInitializer
{
    public static async Task Initialize(IServiceProvider serviceProvider)
    {
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = serviceProvider.GetRequiredService<UserManager<UserIdentity>>();

        // Seed all roles
        string[] roleNames = { "Admin", "Staff", "Customer", "Warehouse", "Kitchen", "Cashier" };

        foreach (var roleName in roleNames)
        {
            var roleExist = await roleManager.RoleExistsAsync(roleName);
            if (!roleExist)
            {
                await roleManager.CreateAsync(new IdentityRole(roleName));
            }
        }

        // Seed default Admin account
        await SeedUser(userManager, "admin@restaurant.com", "Admin@123", "Admin", "Admin");

        // Seed default Staff accounts
        await SeedUser(userManager, "staff@restaurant.com", "Staff@123", "Staff", "Staff");
        await SeedUser(userManager, "warehouse@restaurant.com", "Warehouse@123", "Warehouse Staff", "Warehouse");
        await SeedUser(userManager, "kitchen@restaurant.com", "Kitchen@123", "Kitchen Staff", "Kitchen");
        await SeedUser(userManager, "cashier@restaurant.com", "Cashier@123", "Cashier Staff", "Cashier");

        // Seed default Customer account
        await SeedUser(userManager, "customer@restaurant.com", "Customer@123", "Customer", "Customer");
    }

    private static async Task SeedUser(
        UserManager<UserIdentity> userManager,
        string email,
        string password,
        string fullName,
        string role)
    {
        var existingUser = await userManager.FindByEmailAsync(email);
        if (existingUser == null)
        {
            var user = new UserIdentity
            {
                UserName = email,
                Email = email,
                FullName = fullName,
                EmailConfirmed = true
            };

            var result = await userManager.CreateAsync(user, password);
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(user, role);
            }
        }
    }
}
