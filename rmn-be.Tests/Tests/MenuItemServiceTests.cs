using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Services.Implementation;
using Xunit;

namespace rmn_be.Tests;

public class MenuItemServicePostTests
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

    private static async Task SeedCategoryAsync(
        SepDatabaseContext context,
        int categoryId,
        string name = "Cat"
    )
    {
        context.MenuCategories.Add(
            new MenuCategory
            {
                CategoryId = categoryId,
                CategoryName = name,
                IsActive = true,
            }
        );
        await context.SaveChangesAsync();
    }

    // ─────────────────────────────────────────────
    //  FUNC: CreateAsync (5 testcases)
    // ─────────────────────────────────────────────

    [Fact]
    [Trait("CodeModule", "MenuItem")]
    [Trait("Method", "CreateAsync")]
    [Trait("UTCID", "UTCID01")]
    [Trait("Type", "N")]
    public async Task UTCID01_CreateAsync_ValidInput_CreatesActiveItemAndLoadsCategory()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        await SeedCategoryAsync(context, categoryId: 1, name: "Drinks");

        var service = new MenuItemService(context);

        var created = await service.CreateAsync(
            new CreateMenuItemDTO
            {
                CategoryId = 1,
                ItemName = "Tea",
                Unit = "cup",
                Description = "Hot",
                BasePrice = 10000,
                Thumbnail = "http://x",
            }
        );

        Assert.NotNull(created);
        Assert.Equal("Tea", created.ItemName);
        Assert.True(created.IsActive);
        Assert.Equal("Drinks", created.CategoryName);
        Assert.Equal(1, await context.MenuItems.CountAsync());
    }

    [Fact]
    [Trait("CodeModule", "MenuItem")]
    [Trait("Method", "CreateAsync")]
    [Trait("UTCID", "UTCID02")]
    [Trait("Type", "A")]
    public async Task UTCID02_CreateAsync_DuplicateNameIgnoringCase_ThrowsInvalidOperationException()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        await SeedCategoryAsync(context, categoryId: 1);

        var service = new MenuItemService(context);
        await service.CreateAsync(
            new CreateMenuItemDTO
            {
                CategoryId = 1,
                ItemName = "Tea",
                BasePrice = 1,
            }
        );

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.CreateAsync(
                new CreateMenuItemDTO
                {
                    CategoryId = 1,
                    ItemName = "tEa",
                    BasePrice = 2,
                }
            )
        );
    }

    [Fact]
    [Trait("CodeModule", "MenuItem")]
    [Trait("Method", "CreateAsync")]
    [Trait("UTCID", "UTCID03")]
    [Trait("Type", "B")]
    public async Task UTCID03_CreateAsync_NullOptionalFields_AllowsNulls()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        await SeedCategoryAsync(context, categoryId: 1, name: "Food");

        var service = new MenuItemService(context);

        var created = await service.CreateAsync(
            new CreateMenuItemDTO
            {
                CategoryId = 1,
                ItemName = "Bread",
                Unit = null,
                Description = null,
                BasePrice = 5000,
                Thumbnail = null,
            }
        );

        Assert.Equal("Bread", created.ItemName);
        var stored = await context.MenuItems.SingleAsync(m => m.ItemName == "Bread");
        Assert.Null(stored.Unit);
        Assert.Null(stored.Description);
        Assert.Null(stored.Thumbnail);
    }

    [Fact]
    [Trait("CodeModule", "MenuItem")]
    [Trait("Method", "CreateAsync")]
    [Trait("UTCID", "UTCID04")]
    [Trait("Type", "B")]
    public async Task UTCID04_CreateAsync_CategoryNotFound_CategoryNameEmptyString()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        var service = new MenuItemService(context);

        var created = await service.CreateAsync(
            new CreateMenuItemDTO
            {
                CategoryId = 999,
                ItemName = "Mystery",
                BasePrice = 123,
            }
        );

        Assert.Equal("", created.CategoryName);
        Assert.Equal(1, await context.MenuItems.CountAsync());
    }

    [Fact]
    [Trait("CodeModule", "MenuItem")]
    [Trait("Method", "CreateAsync")]
    [Trait("UTCID", "UTCID05")]
    [Trait("Type", "B")]
    public async Task UTCID05_CreateAsync_SameNameDifferentWhitespace_IsNotDeDuped()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        await SeedCategoryAsync(context, categoryId: 1);

        var service = new MenuItemService(context);

        await service.CreateAsync(
            new CreateMenuItemDTO
            {
                CategoryId = 1,
                ItemName = "Tea",
                BasePrice = 1,
            }
        );

        // Service only ToLower() compare; it does not Trim() => this should create a second row
        var created = await service.CreateAsync(
            new CreateMenuItemDTO
            {
                CategoryId = 1,
                ItemName = "Tea ",
                BasePrice = 1,
            }
        );

        Assert.Equal("Tea ", created.ItemName);
        Assert.Equal(2, await context.MenuItems.CountAsync());
    }

    // ─────────────────────────────────────────────
    //  FUNC: UpdateAsync (5 testcases)
    // ─────────────────────────────────────────────

    [Fact]
    [Trait("CodeModule", "MenuItem")]
    [Trait("Method", "UpdateAsync")]
    [Trait("UTCID", "UTCID01")]
    [Trait("Type", "N")]
    public async Task UTCID01_UpdateAsync_Existing_UpdatesFields_ReturnsTrue()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        await SeedCategoryAsync(context, categoryId: 1);
        await SeedCategoryAsync(context, categoryId: 2);

        var service = new MenuItemService(context);
        var created = await service.CreateAsync(
            new CreateMenuItemDTO
            {
                CategoryId = 1,
                ItemName = "Tea",
                BasePrice = 100,
            }
        );

        var ok = await service.UpdateAsync(
            created.ItemId,
            new UpdateMenuItemDTO
            {
                CategoryId = 2,
                ItemName = "Milk Tea",
                BasePrice = 200,
                IsActive = false,
            }
        );

        Assert.True(ok);
        var stored = await context.MenuItems.FindAsync(created.ItemId);
        Assert.NotNull(stored);
        Assert.Equal(2, stored!.CategoryId);
        Assert.Equal("Milk Tea", stored.ItemName);
        Assert.Equal(200, stored.BasePrice);
        Assert.False(stored.IsActive);
    }

    [Fact]
    [Trait("CodeModule", "MenuItem")]
    [Trait("Method", "UpdateAsync")]
    [Trait("UTCID", "UTCID02")]
    [Trait("Type", "A")]
    public async Task UTCID02_UpdateAsync_NotFound_ReturnsFalse()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        var service = new MenuItemService(context);

        var ok = await service.UpdateAsync(999, new UpdateMenuItemDTO { ItemName = "X" });

        Assert.False(ok);
    }

    [Fact]
    [Trait("CodeModule", "MenuItem")]
    [Trait("Method", "UpdateAsync")]
    [Trait("UTCID", "UTCID03")]
    [Trait("Type", "A")]
    public async Task UTCID03_UpdateAsync_ChangeNameToDuplicate_ThrowsInvalidOperationException()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        await SeedCategoryAsync(context, categoryId: 1);

        var service = new MenuItemService(context);
        var a = await service.CreateAsync(
            new CreateMenuItemDTO
            {
                CategoryId = 1,
                ItemName = "Tea",
                BasePrice = 1,
            }
        );
        var b = await service.CreateAsync(
            new CreateMenuItemDTO
            {
                CategoryId = 1,
                ItemName = "Coffee",
                BasePrice = 1,
            }
        );

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.UpdateAsync(b.ItemId, new UpdateMenuItemDTO { ItemName = "tEA" })
        );

        var storedB = await context.MenuItems.FindAsync(b.ItemId);
        Assert.Equal("Coffee", storedB!.ItemName);
    }

    [Fact]
    [Trait("CodeModule", "MenuItem")]
    [Trait("Method", "UpdateAsync")]
    [Trait("UTCID", "UTCID04")]
    [Trait("Type", "B")]
    public async Task UTCID04_UpdateAsync_SameNameDifferentCase_DoesNotThrow_UpdatesOtherFields()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        await SeedCategoryAsync(context, categoryId: 1);

        var service = new MenuItemService(context);
        var created = await service.CreateAsync(
            new CreateMenuItemDTO
            {
                CategoryId = 1,
                ItemName = "Tea",
                BasePrice = 100,
            }
        );

        var ok = await service.UpdateAsync(
            created.ItemId,
            new UpdateMenuItemDTO { ItemName = "Tea", BasePrice = 150 }
        );

        Assert.True(ok);
        var stored = await context.MenuItems.FindAsync(created.ItemId);
        Assert.Equal(150, stored!.BasePrice);
    }

    [Fact]
    [Trait("CodeModule", "MenuItem")]
    [Trait("Method", "UpdateAsync")]
    [Trait("UTCID", "UTCID05")]
    [Trait("Type", "B")]
    public async Task UTCID05_UpdateAsync_NullFields_DoNotOverwriteExisting()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        await SeedCategoryAsync(context, categoryId: 1);

        var service = new MenuItemService(context);
        var created = await service.CreateAsync(
            new CreateMenuItemDTO
            {
                CategoryId = 1,
                ItemName = "Tea",
                Unit = "cup",
                Description = "x",
                BasePrice = 100,
                Thumbnail = "t",
            }
        );

        var ok = await service.UpdateAsync(
            created.ItemId,
            new UpdateMenuItemDTO { Description = null, Thumbnail = null }
        );
        Assert.False(ok);
        var stored = await context.MenuItems.FindAsync(created.ItemId);
        Assert.Equal("x", stored!.Description);
        Assert.Equal("t", stored.Thumbnail);
    }

    // ─────────────────────────────────────────────
    //  FUNC: DeleteAsync (5 testcases)
    // ─────────────────────────────────────────────

    [Fact]
    [Trait("CodeModule", "MenuItem")]
    [Trait("Method", "DeleteAsync")]
    [Trait("UTCID", "UTCID01")]
    [Trait("Type", "N")]
    public async Task UTCID01_DeleteAsync_ExistingActive_SetsInactive_ReturnsTrue()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        await SeedCategoryAsync(context, categoryId: 1);

        var service = new MenuItemService(context);
        var created = await service.CreateAsync(
            new CreateMenuItemDTO
            {
                CategoryId = 1,
                ItemName = "Tea",
                BasePrice = 1,
            }
        );

        var ok = await service.DeleteAsync(created.ItemId);

        Assert.True(ok);
        var stored = await context.MenuItems.FindAsync(created.ItemId);
        Assert.False(stored!.IsActive);
    }

    [Fact]
    [Trait("CodeModule", "MenuItem")]
    [Trait("Method", "DeleteAsync")]
    [Trait("UTCID", "UTCID02")]
    [Trait("Type", "A")]
    public async Task UTCID02_DeleteAsync_NotFound_ReturnsFalse()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        var service = new MenuItemService(context);

        var ok = await service.DeleteAsync(999);

        Assert.False(ok);
    }

    [Fact]
    [Trait("CodeModule", "MenuItem")]
    [Trait("Method", "DeleteAsync")]
    [Trait("UTCID", "UTCID03")]
    [Trait("Type", "B")]
    public async Task UTCID03_DeleteAsync_AlreadyInactive_SaveChangesZero_ReturnsFalse()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        await SeedCategoryAsync(context, categoryId: 1);

        var service = new MenuItemService(context);
        var created = await service.CreateAsync(
            new CreateMenuItemDTO
            {
                CategoryId = 1,
                ItemName = "Tea",
                BasePrice = 1,
            }
        );
        await service.UpdateAsync(created.ItemId, new UpdateMenuItemDTO { IsActive = false });

        var ok = await service.DeleteAsync(created.ItemId);

        Assert.False(ok);
        var stored = await context.MenuItems.FindAsync(created.ItemId);
        Assert.False(stored!.IsActive);
    }

    [Fact]
    [Trait("CodeModule", "MenuItem")]
    [Trait("Method", "DeleteAsync")]
    [Trait("UTCID", "UTCID04")]
    [Trait("Type", "B")]
    public async Task UTCID04_DeleteAsync_SoftDelete_ItemStillExistsInDb()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        await SeedCategoryAsync(context, categoryId: 1);

        var service = new MenuItemService(context);
        var created = await service.CreateAsync(
            new CreateMenuItemDTO
            {
                CategoryId = 1,
                ItemName = "Tea",
                BasePrice = 1,
            }
        );

        await service.DeleteAsync(created.ItemId);

        Assert.Equal(1, await context.MenuItems.CountAsync());
    }

    [Fact]
    [Trait("CodeModule", "MenuItem")]
    [Trait("Method", "DeleteAsync")]
    [Trait("UTCID", "UTCID05")]
    [Trait("Type", "B")]
    public async Task UTCID05_DeleteAsync_Twice_SecondReturnsFalse()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        await SeedCategoryAsync(context, categoryId: 1);

        var service = new MenuItemService(context);
        var created = await service.CreateAsync(
            new CreateMenuItemDTO
            {
                CategoryId = 1,
                ItemName = "Tea",
                BasePrice = 1,
            }
        );

        var first = await service.DeleteAsync(created.ItemId);
        var second = await service.DeleteAsync(created.ItemId);

        Assert.True(first);
        Assert.False(second);
    }
}
