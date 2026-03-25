using Microsoft.AspNetCore.Identity;
using SEP_Restaurant_management.Core.Models;

namespace SEP_Restaurant_management.Core.Data;

public static class DbInitializer
{
    public static async Task Initialize(IServiceProvider serviceProvider)
    {
        await System.IO.File.WriteAllTextAsync(
            "/Users/dotritrong/Desktop/G26/rmn-be/canary.txt",
            "--- Seeding Started at " + DateTime.UtcNow + " ---\n"
        );
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = serviceProvider.GetRequiredService<UserManager<UserIdentity>>();

        // Seed all roles
        string[] roleNames =
        {
            "Admin",
            "Manager",
            "Staff",
            "Customer",
            "Warehouse",
            "Kitchen",
            "Cashier",
            "Receptionist",
        };

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

        // Seed default Staff and Manager accounts
        await SeedUser(userManager, "manager@restaurant.com", "Manager@123", "Manager", "Manager");
        await SeedUser(userManager, "staff@restaurant.com", "Staff@123", "Staff", "Staff");
        await SeedUser(
            userManager,
            "warehouse@restaurant.com",
            "Warehouse@123",
            "Warehouse Staff",
            "Warehouse"
        );
        await SeedUser(
            userManager,
            "kitchen@restaurant.com",
            "Kitchen@123",
            "Kitchen Staff",
            "Kitchen"
        );
        await SeedUser(
            userManager,
            "receptionist@restaurant.com",
            "Receptionist@123",
            "Receptionist Staff",
            "Receptionist"
        );
        await SeedUser(
            userManager,
            "cashier@restaurant.com",
            "Cashier@123",
            "Cashier Staff",
            "Cashier"
        );

        // Seed default Customer account
        await SeedUser(
            userManager,
            "customer@restaurant.com",
            "Customer@123",
            "Customer",
            "Customer"
        );
        await SeedUser(userManager, "trongytb2@gmail.com", "123456", "Test Customer", "Customer");

        // Ensure all system users have Staff records
        await EnsureStaffRecords(serviceProvider, userManager);

        // Seed sample warehouse data
        await SeedWarehouseData(serviceProvider, userManager);

        // Seed system configurations
        await SeedSystemConfig(serviceProvider);

        // Seed restaurant management data
        await SeedRestaurantData(serviceProvider);

        // Seed testing data (Reservations, Orders)
        await SeedTestingData(serviceProvider);
    }

    private static async Task SeedUser(
        UserManager<UserIdentity> userManager,
        string email,
        string password,
        string fullName,
        string role
    )
    {
        var existingUser = await userManager.FindByEmailAsync(email);
        if (existingUser == null)
        {
            var user = new UserIdentity
            {
                UserName = email,
                Email = email,
                FullName = fullName,
                EmailConfirmed = true,
            };

            var result = await userManager.CreateAsync(user, password);
            if (result.Succeeded)
            {
                await userManager.AddToRoleAsync(user, role);
                await System.IO.File.AppendAllTextAsync(
                    "/Users/dotritrong/Desktop/G26/rmn-be/canary.txt",
                    $"\n[DbInitializer] Successfully created user: {email} with role: {role}"
                );
            }
            else
            {
                var errors = string.Join(", ", result.Errors.Select(e => e.Description));
                await System.IO.File.AppendAllTextAsync(
                    "/Users/dotritrong/Desktop/G26/rmn-be/canary.txt",
                    $"\n[DbInitializer] Failed to create user {email}: {errors}"
                );
            }
        }
        else
        {
            await System.IO.File.AppendAllTextAsync(
                "/Users/dotritrong/Desktop/G26/rmn-be/canary.txt",
                $"\n[DbInitializer] User already exists: {email}. Skipping creation."
            );
        }
    }

    private static async Task SeedSystemConfig(IServiceProvider serviceProvider)
    {
        var context = serviceProvider.GetRequiredService<SepDatabaseContext>();

        var defaultConfigs = new List<SystemConfig>
        {
            new SystemConfig
            {
                ConfigKey = "VAT_ENABLED",
                ConfigValue = "true",
                Description = "Bật/Tắt thu thuế VAT",
            },
            new SystemConfig
            {
                ConfigKey = "VAT_RATE",
                ConfigValue = "8",
                Description = "Tỷ lệ thuế VAT (%)",
            },
            new SystemConfig
            {
                ConfigKey = "LOYALTY_EARN_RATE",
                ConfigValue = "100000",
                Description = "Số tiền tương đương 1 điểm tích lũy (VNĐ)",
            },
            new SystemConfig
            {
                ConfigKey = "LOYALTY_REDEEM_RATE",
                ConfigValue = "1000",
                Description = "Giá trị quy đổi của 1 điểm (VNĐ)",
            },
        };

        foreach (var config in defaultConfigs)
        {
            if (!context.SystemConfigs.Any(c => c.ConfigKey == config.ConfigKey))
            {
                context.SystemConfigs.Add(config);
            }
        }
        await context.SaveChangesAsync();

        if (!context.LoyaltyTiers.Any())
        {
            context.LoyaltyTiers.AddRange(
                new LoyaltyTier
                {
                    TierName = "Thành viên",
                    MinPoints = 0,
                    DiscountRate = 0,
                    IsActive = true,
                },
                new LoyaltyTier
                {
                    TierName = "Bạc",
                    MinPoints = 100,
                    DiscountRate = 5,
                    IsActive = true,
                },
                new LoyaltyTier
                {
                    TierName = "Vàng",
                    MinPoints = 500,
                    DiscountRate = 10,
                    IsActive = true,
                },
                new LoyaltyTier
                {
                    TierName = "Kim Cương",
                    MinPoints = 1000,
                    DiscountRate = 15,
                    IsActive = true,
                }
            );
            await context.SaveChangesAsync();
        }

        if (!context.DiscountCodes.Any())
        {
            context.DiscountCodes.AddRange(
                new DiscountCode
                {
                    Code = "WELCOME10",
                    DiscountType = "PERCENT",
                    DiscountValue = 10,
                    MinOrderValue = 100000,
                    MaxDiscountAmount = 50000,
                    IsActive = true,
                },
                new DiscountCode
                {
                    Code = "TET2026",
                    DiscountType = "PERCENT",
                    DiscountValue = 15,
                    MinOrderValue = 500000,
                    MaxDiscountAmount = 100000,
                    IsActive = true,
                },
                new DiscountCode
                {
                    Code = "GIAM50K",
                    DiscountType = "AMOUNT",
                    DiscountValue = 50000,
                    MinOrderValue = 300000,
                    IsActive = true,
                }
            );
            await context.SaveChangesAsync();
        }
    }

    private static async Task SeedWarehouseData(
        IServiceProvider serviceProvider,
        UserManager<UserIdentity> userManager
    )
    {
        var context = serviceProvider.GetRequiredService<SepDatabaseContext>();

        // 1. Ingredients
        if (!context.Ingredients.Any())
        {
            var ingredients = new List<Ingredient>
            {
                new Ingredient { IngredientName = "Beef Ribeye", Unit = "kg" },
                new Ingredient { IngredientName = "Chicken Breast", Unit = "kg" },
                new Ingredient { IngredientName = "Salmon Fillet", Unit = "kg" },
                new Ingredient { IngredientName = "Onion", Unit = "kg" },
                new Ingredient { IngredientName = "Garlic", Unit = "kg" },
                new Ingredient { IngredientName = "Olive Oil", Unit = "l" },
                new Ingredient { IngredientName = "Salt", Unit = "kg" },
                new Ingredient { IngredientName = "Black Pepper", Unit = "kg" },
                new Ingredient { IngredientName = "Milk", Unit = "l" },
                new Ingredient { IngredientName = "Eggs", Unit = "pcs" },
                new Ingredient { IngredientName = "Sugar", Unit = "kg" },
                new Ingredient { IngredientName = "Premium Rice", Unit = "kg" },
            };
            context.Ingredients.AddRange(ingredients);
            await context.SaveChangesAsync();
        }

        // 2. Supplier
        if (!context.Suppliers.Any())
        {
            var supplier = new Supplier
            {
                SupplierName = "Fresh Foods Co.",
                Phone = "0901234567",
                Email = "contact@freshfoods.com",
                Address = "123 Market Street, HCMC",
            };
            context.Suppliers.Add(supplier);
            await context.SaveChangesAsync();
        }

        // 3. Purchase Receipt & Stock Movements
        if (!context.PurchaseReceipts.Any() && context.Ingredients.Any() && context.Suppliers.Any())
        {
            var warehouseUser = await userManager.FindByEmailAsync("warehouse@restaurant.com");
            var staff = context.Staffs.FirstOrDefault(s => s.UserId == warehouseUser.Id);
            if (staff == null && warehouseUser != null)
            {
                staff = new Staff
                {
                    UserId = warehouseUser.Id,
                    StaffCode = "WH001",
                    FullName = "Warehouse Staff",
                    Email = "warehouse@restaurant.com",
                    CreatedAt = DateTime.UtcNow,
                };
                context.Staffs.Add(staff);
                await context.SaveChangesAsync();
            }
            if (staff != null)
            {
                long staffId = staff.StaffId;
                var supplier = context.Suppliers.First();
                var dbIngredients = context.Ingredients.Take(12).ToList(); // take some to seed

                var receipt = new PurchaseReceipt
                {
                    ReceiptCode = "PRC-TEST-001",
                    SupplierId = supplier.SupplierId,
                    ReceiptDate = DateTime.UtcNow.AddDays(-1),
                    TotalAmount = 5500000,
                    Status = "RECEIVED",
                    CreatedByStaffId = staffId,
                    Note = "Initial stock supply",
                };
                context.PurchaseReceipts.Add(receipt);
                await context.SaveChangesAsync();

                if (dbIngredients.Count >= 12)
                {
                    var receiptItems = new List<PurchaseReceiptItem>
                    {
                        new PurchaseReceiptItem
                        {
                            ReceiptId = receipt.ReceiptId,
                            IngredientId = dbIngredients[0].IngredientId,
                            Quantity = 10,
                            UnitCost = 250000,
                        },
                        new PurchaseReceiptItem
                        {
                            ReceiptId = receipt.ReceiptId,
                            IngredientId = dbIngredients[1].IngredientId,
                            Quantity = 20,
                            UnitCost = 80000,
                        },
                        new PurchaseReceiptItem
                        {
                            ReceiptId = receipt.ReceiptId,
                            IngredientId = dbIngredients[2].IngredientId,
                            Quantity = 5,
                            UnitCost = 300000,
                        },
                        new PurchaseReceiptItem
                        {
                            ReceiptId = receipt.ReceiptId,
                            IngredientId = dbIngredients[5].IngredientId,
                            Quantity = 10,
                            UnitCost = 150000,
                        }, // Olive Oil
                        new PurchaseReceiptItem
                        {
                            ReceiptId = receipt.ReceiptId,
                            IngredientId = dbIngredients[11].IngredientId,
                            Quantity = 50,
                            UnitCost = 25000,
                        }, // Rice
                    };
                    context.PurchaseReceiptItems.AddRange(receiptItems);

                    // Calculate actual stock movements from receipt
                    foreach (var item in receiptItems)
                    {
                        context.StockMovements.Add(
                            new StockMovement
                            {
                                IngredientId = item.IngredientId,
                                MovementType = "IN",
                                Quantity = item.Quantity,
                                RefType = "PURCHASE_RECEIPT",
                                RefId = receipt.ReceiptId,
                                MovedAt = DateTime.UtcNow,
                                CreatedByStaffId = staffId,
                                Note = "Received from PRC-TEST-001",
                            }
                        );
                    }
                    await context.SaveChangesAsync();

                    // Add a few manual adjustments to simulate low stock
                    context.StockMovements.Add(
                        new StockMovement
                        {
                            IngredientId = dbIngredients[0].IngredientId,
                            MovementType = "ADJUST",
                            Quantity = -2.5m,
                            MovedAt = DateTime.UtcNow,
                            CreatedByStaffId = staffId,
                            Note = "Spoiled meat",
                        }
                    );
                    context.StockMovements.Add(
                        new StockMovement
                        {
                            IngredientId = dbIngredients[2].IngredientId,
                            MovementType = "OUT",
                            Quantity = -4.5m, // almost out of stock
                            MovedAt = DateTime.UtcNow,
                            CreatedByStaffId = staffId,
                            Note = "Used for orders",
                        }
                    );

                    await context.SaveChangesAsync();
                }
            }
        }
    }

    private static async Task SeedRestaurantData(IServiceProvider serviceProvider)
    {
        var context = serviceProvider.GetRequiredService<SepDatabaseContext>();

        // Initialize tables if empty (temporarily disabled force-wipe to prevent FK constraint crashes)

        // 1. Seed Menu Categories
        if (!context.MenuCategories.Any())
        {
            var categories = new List<MenuCategory>
            {
                new MenuCategory
                {
                    CategoryName = "Món Khai Vị",
                    Description = "Các món ăn nhẹ đầu bữa",
                    DisplayOrder = 1,
                    IsActive = true,
                },
                new MenuCategory
                {
                    CategoryName = "Món Chính",
                    Description = "Các món chính đậm đà",
                    DisplayOrder = 2,
                    IsActive = true,
                },
                new MenuCategory
                {
                    CategoryName = "Lẩu & Nướng",
                    Description = "Thích hợp cho đi đông người",
                    DisplayOrder = 3,
                    IsActive = true,
                },
                new MenuCategory
                {
                    CategoryName = "Tráng Miệng",
                    Description = "Đồ ngọt và trái cây",
                    DisplayOrder = 4,
                    IsActive = true,
                },
                new MenuCategory
                {
                    CategoryName = "Đồ Uống",
                    Description = "Nước giải khát, bia và rượu",
                    DisplayOrder = 5,
                    IsActive = true,
                },
            };
            context.MenuCategories.AddRange(categories);
            await context.SaveChangesAsync();
        }

        // 2. Seed Menu Items
        if (!context.MenuItems.Any() && context.MenuCategories.Any())
        {
            var categories = context.MenuCategories.ToList();
            var appetizerCat =
                categories.FirstOrDefault(c => c.CategoryName == "Món Khai Vị")?.CategoryId
                ?? categories.First().CategoryId;
            var mainCat =
                categories.FirstOrDefault(c => c.CategoryName == "Món Chính")?.CategoryId
                ?? categories.First().CategoryId;
            var hotpotCat =
                categories.FirstOrDefault(c => c.CategoryName == "Lẩu & Nướng")?.CategoryId
                ?? categories.First().CategoryId;
            var drinkCat =
                categories.FirstOrDefault(c => c.CategoryName == "Đồ Uống")?.CategoryId
                ?? categories.First().CategoryId;

            var items = new List<MenuItem>
            {
                // Khai vị
                new MenuItem
                {
                    CategoryId = appetizerCat,
                    ItemName = "Salad Dầu Giấm",
                    Unit = "Dĩa",
                    Description = "Salad tươi mát",
                    BasePrice = 45000,
                    Thumbnail =
                        "https://media.cooky.vn/images/blog-2016/nghe-thuat-trinh-bay-va-chup-anh-mon-an%208.jpg",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                },
                new MenuItem
                {
                    CategoryId = appetizerCat,
                    ItemName = "Gỏi Ngó Sen Tôm Thịt",
                    Unit = "Dĩa",
                    Description = "Gỏi ngó sen giòn rụm",
                    BasePrice = 85000,
                    Thumbnail =
                        "https://media.cooky.vn/images/blog-2016/nghe-thuat-trinh-bay-va-chup-anh-mon-an%208.jpg",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                },
                // Món chính
                new MenuItem
                {
                    CategoryId = mainCat,
                    ItemName = "Gà Bó Xôi",
                    Unit = "Con",
                    Description = "Gà ta bó xôi chiên giòn",
                    BasePrice = 350000,
                    Thumbnail =
                        "https://media.cooky.vn/images/blog-2016/nghe-thuat-trinh-bay-va-chup-anh-mon-an%208.jpg",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                },
                new MenuItem
                {
                    CategoryId = mainCat,
                    ItemName = "Tôm Hùm Nướng Phô Mai",
                    Unit = "Kg",
                    Description = "Tôm hùm Pháp",
                    BasePrice = 1250000,
                    Thumbnail =
                        "https://media.cooky.vn/images/blog-2016/nghe-thuat-trinh-bay-va-chup-anh-mon-an%208.jpg",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                },
                new MenuItem
                {
                    CategoryId = mainCat,
                    ItemName = "Bò Lúc Lắc",
                    Unit = "Phần",
                    Description = "Bò Úc xào",
                    BasePrice = 150000,
                    Thumbnail =
                        "https://media.cooky.vn/images/blog-2016/nghe-thuat-trinh-bay-va-chup-anh-mon-an%208.jpg",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                },
                // Lẩu & nướng
                new MenuItem
                {
                    CategoryId = hotpotCat,
                    ItemName = "Lẩu Thái Hải Sản",
                    Unit = "Nồi",
                    Description = "Lẩu chua cay",
                    BasePrice = 280000,
                    Thumbnail =
                        "https://media.cooky.vn/images/blog-2016/nghe-thuat-trinh-bay-va-chup-anh-mon-an%208.jpg",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                },
                new MenuItem
                {
                    CategoryId = hotpotCat,
                    ItemName = "Sườn Nướng BBQ",
                    Unit = "Sz L",
                    Description = "Sườn nướng tảng",
                    BasePrice = 450000,
                    Thumbnail =
                        "https://media.cooky.vn/images/blog-2016/nghe-thuat-trinh-bay-va-chup-anh-mon-an%208.jpg",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                },
                // Đồ uống
                new MenuItem
                {
                    CategoryId = drinkCat,
                    ItemName = "Bia Tiger Bạc",
                    Unit = "Lon",
                    Description = "Bia lon",
                    BasePrice = 25000,
                    Thumbnail =
                        "https://media.cooky.vn/images/blog-2016/nghe-thuat-trinh-bay-va-chup-anh-mon-an%208.jpg",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                },
                new MenuItem
                {
                    CategoryId = drinkCat,
                    ItemName = "Nước Suối Dasani",
                    Unit = "Chai",
                    Description = "Chai 500ml",
                    BasePrice = 15000,
                    Thumbnail =
                        "https://media.cooky.vn/images/blog-2016/nghe-thuat-trinh-bay-va-chup-anh-mon-an%208.jpg",
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                },
            };
            context.MenuItems.AddRange(items);
            await context.SaveChangesAsync();
        }

        // 3. Seed Dining Tables
        if (!context.DiningTables.Any())
        {
            var tables = new List<DiningTable>();
            // Tầng 1
            for (int i = 1; i <= 6; i++)
            {
                tables.Add(
                    new DiningTable
                    {
                        TableCode = $"T1-{i:D2}",
                        TableName = $"Bàn T1-{i}",
                        Capacity = 4,
                        Status = "AVAILABLE",
                        IsActive = true,
                    }
                );
            }
            // Tầng 2 & VIP
            for (int i = 1; i <= 4; i++)
            {
                tables.Add(
                    new DiningTable
                    {
                        TableCode = $"VIP-{i}",
                        TableName = $"VIP {i}",
                        Capacity = 8,
                        Status = "AVAILABLE",
                        IsActive = true,
                    }
                );
            }
            context.DiningTables.AddRange(tables);
            await context.SaveChangesAsync();
        }
    }

    private static async Task EnsureStaffRecords(
        IServiceProvider serviceProvider,
        UserManager<UserIdentity> userManager
    )
    {
        var context = serviceProvider.GetRequiredService<SepDatabaseContext>();
        var rolesToStaff = new[] { "Manager", "Staff", "Kitchen", "Receptionist", "Warehouse" };

        foreach (var role in rolesToStaff)
        {
            var usersInRole = await userManager.GetUsersInRoleAsync(role);
            foreach (var user in usersInRole)
            {
                if (!context.Staffs.Any(s => s.UserId == user.Id))
                {
                    context.Staffs.Add(
                        new Staff
                        {
                            UserId = user.Id,
                            StaffCode =
                                $"{role.Substring(0, 2).ToUpper()}{(new Random().Next(100, 999))}",
                            FullName = user.FullName ?? "Staff Name",
                            WorkingStatus = "ACTIVE",
                            CreatedAt = DateTime.UtcNow,
                        }
                    );
                }
            }
        }
        await context.SaveChangesAsync();
    }

    private static async Task SeedTestingData(IServiceProvider serviceProvider)
    {
        var context = serviceProvider.GetRequiredService<SepDatabaseContext>();

        // 1. Seed sample customers
        if (!context.Customers.Any(c => c.Phone == "0987654321"))
        {
            context.Customers.Add(
                new Customer
                {
                    FullName = "Nguyễn Văn A",
                    Phone = "0987654321",
                    CreatedAt = DateTime.UtcNow,
                }
            );
            context.Customers.Add(
                new Customer
                {
                    FullName = "Trần Thị B",
                    Phone = "0123456789",
                    CreatedAt = DateTime.UtcNow,
                }
            );
            await context.SaveChangesAsync();
        }

        // 1.5 Seed profile for the test customer user
        var userManager = serviceProvider.GetRequiredService<UserManager<UserIdentity>>();
        var targetUser = await userManager.FindByEmailAsync("trongytb2@gmail.com");
        if (targetUser != null && !context.Customers.Any(c => c.UserId == targetUser.Id))
        {
            context.Customers.Add(
                new Customer
                {
                    UserId = targetUser.Id,
                    FullName = targetUser.FullName ?? "Test Customer",
                    Email = targetUser.Email,
                    Phone = "0999999999", // Dummy phone
                    CreatedAt = DateTime.UtcNow,
                }
            );
            await context.SaveChangesAsync();
        }

        // 2. Seed some Reservations for testing Check-in
        if (!context.Reservations.Any())
        {
            var today = DateTime.UtcNow.Date;
            context.Reservations.AddRange(
                new Reservation
                {
                    CustomerName = "Lê Văn C",
                    CustomerPhone = "0999888777",
                    PartySize = 4,
                    ReservedAt = today.AddHours(19), // 7 PM today
                    Status = "CONFIRMED",
                    Note = "Gần cửa sổ",
                },
                new Reservation
                {
                    CustomerName = "Phạm Quang D",
                    CustomerPhone = "0888777666",
                    PartySize = 2,
                    ReservedAt = today.AddHours(20), // 8 PM today
                    Status = "PENDING",
                    Note = "Lãng mạn",
                }
            );
            await context.SaveChangesAsync();
        }

        // 3. Seed some Active Orders for Kitchen Queue / Table Transfer
        if (!context.Orders.Any(o => o.Status == "OPEN" || o.Status == "SENT_TO_KITCHEN"))
        {
            var table = context.DiningTables.FirstOrDefault(t => t.TableCode == "T1-01");
            var staff = context.Staffs.FirstOrDefault();
            var menuItems = context.MenuItems.Take(3).ToList();

            if (table != null && staff != null && menuItems.Count >= 2)
            {
                // Create an order on T1-01
                var order = new Order
                {
                    OrderCode = "TEST-ORD-001",
                    TableId = table.TableId,
                    Status = "SENT_TO_KITCHEN",
                    OrderType = "DINE_IN",
                    OpenedAt = DateTime.UtcNow,
                    CreatedByStaffId = staff.StaffId,
                };
                context.Orders.Add(order);
                await context.SaveChangesAsync();

                context.OrderItems.AddRange(
                    new OrderItem
                    {
                        OrderId = order.OrderId,
                        ItemId = menuItems[0].ItemId,
                        ItemNameSnapshot = menuItems[0].ItemName,
                        Quantity = 2,
                        UnitPrice = menuItems[0].BasePrice,
                        Status = "PENDING",
                    },
                    new OrderItem
                    {
                        OrderId = order.OrderId,
                        ItemId = menuItems[1].ItemId,
                        ItemNameSnapshot = menuItems[1].ItemName,
                        Quantity = 1,
                        UnitPrice = menuItems[1].BasePrice,
                        Status = "IN_PROGRESS",
                    }
                );

                table.Status = "OCCUPIED";
                await context.SaveChangesAsync();
            }
        }
    }
}
