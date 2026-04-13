using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Services.Implementation;
using Xunit;

namespace rmn_be.Tests;

public class PromotionServiceDiscountCodePostTests
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

    // ─────────────────────────────────────────────
    //  FUNC: CreateDiscountCodeAsync (5 testcases)
    // ─────────────────────────────────────────────

    [Fact]
    [Trait("CodeModule", "Promotion")]
    [Trait("Method", "CreateDiscountCodeAsync")]
    [Trait("UTCID", "UTCID01")]
    [Trait("Type", "N")]
    public async Task UTCID01_CreateDiscountCodeAsync_ValidInput_CreatesAndReturnsDto()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new PromotionService(context);

        var created = await service.CreateDiscountCodeAsync(
            new CreateDiscountCodeDTO
            {
                Code = "SAVE10",
                DiscountType = "PERCENT",
                DiscountValue = 10,
                IsActive = true,
            }
        );

        Assert.NotNull(created);
        Assert.Equal("SAVE10", created!.Code);
        Assert.True(created.IsActive);
        Assert.Equal(1, await context.DiscountCodes.CountAsync());
    }

    [Fact]
    [Trait("CodeModule", "Promotion")]
    [Trait("Method", "CreateDiscountCodeAsync")]
    [Trait("UTCID", "UTCID02")]
    [Trait("Type", "A")]
    public async Task UTCID02_CreateDiscountCodeAsync_DuplicateCodeIgnoringCase_ThrowsException()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new PromotionService(context);

        await service.CreateDiscountCodeAsync(
            new CreateDiscountCodeDTO
            {
                Code = "SAVE10",
                DiscountType = "PERCENT",
                DiscountValue = 10,
                IsActive = true,
            }
        );

        await Assert.ThrowsAsync<Exception>(() =>
            service.CreateDiscountCodeAsync(
                new CreateDiscountCodeDTO
                {
                    Code = "save10",
                    DiscountType = "PERCENT",
                    DiscountValue = 10,
                    IsActive = true,
                }
            )
        );
    }

    [Fact]
    [Trait("CodeModule", "Promotion")]
    [Trait("Method", "CreateDiscountCodeAsync")]
    [Trait("UTCID", "UTCID03")]
    [Trait("Type", "B")]
    public async Task UTCID03_CreateDiscountCodeAsync_LowercaseCode_NormalizesToUppercase()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new PromotionService(context);

        var created = await service.CreateDiscountCodeAsync(
            new CreateDiscountCodeDTO
            {
                Code = "welcome",
                DiscountType = "PERCENT",
                DiscountValue = 5,
                IsActive = true,
            }
        );

        Assert.NotNull(created);
        Assert.Equal("WELCOME", created!.Code);
        var stored = await context.DiscountCodes.SingleAsync();
        Assert.Equal("WELCOME", stored.Code);
    }

    [Fact]
    [Trait("CodeModule", "Promotion")]
    [Trait("Method", "CreateDiscountCodeAsync")]
    [Trait("UTCID", "UTCID04")]
    [Trait("Type", "B")]
    public async Task UTCID04_CreateDiscountCodeAsync_WithValidityDates_PersistsDates()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new PromotionService(context);

        var from = new DateTime(2026, 4, 1);
        var to = new DateTime(2026, 4, 30);

        var created = await service.CreateDiscountCodeAsync(
            new CreateDiscountCodeDTO
            {
                Code = "APRIL",
                DiscountType = "PERCENT",
                DiscountValue = 15,
                ValidFrom = from,
                ValidTo = to,
                IsActive = true,
            }
        );

        Assert.NotNull(created);
        Assert.Equal(from, created!.ValidFrom);
        Assert.Equal(to, created.ValidTo);
    }

    [Fact]
    [Trait("CodeModule", "Promotion")]
    [Trait("Method", "CreateDiscountCodeAsync")]
    [Trait("UTCID", "UTCID05")]
    [Trait("Type", "B")]
    public async Task UTCID05_CreateDiscountCodeAsync_InactiveFlag_CreatesInactive()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new PromotionService(context);

        var created = await service.CreateDiscountCodeAsync(
            new CreateDiscountCodeDTO
            {
                Code = "OFF",
                DiscountType = "FIXED",
                DiscountValue = 1,
                IsActive = false,
            }
        );

        Assert.NotNull(created);
        Assert.False(created!.IsActive);
    }

    // ─────────────────────────────────────────────
    //  FUNC: UpdateDiscountCodeAsync (5 testcases)
    // ─────────────────────────────────────────────

    [Fact]
    [Trait("CodeModule", "Promotion")]
    [Trait("Method", "UpdateDiscountCodeAsync")]
    [Trait("UTCID", "UTCID01")]
    [Trait("Type", "N")]
    public async Task UTCID01_UpdateDiscountCodeAsync_Existing_UpdatesAndReturnsDto()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new PromotionService(context);

        var created = await service.CreateDiscountCodeAsync(
            new CreateDiscountCodeDTO
            {
                Code = "SAVE10",
                DiscountType = "PERCENT",
                DiscountValue = 10,
                IsActive = true,
            }
        );

        var updated = await service.UpdateDiscountCodeAsync(
            created!.DiscountId,
            new UpdateDiscountCodeDTO
            {
                Code = "SAVE20",
                DiscountType = "PERCENT",
                DiscountValue = 20,
                IsActive = true,
            }
        );

        Assert.NotNull(updated);
        Assert.Equal("SAVE20", updated!.Code);
        Assert.Equal(20, updated.DiscountValue);
    }

    [Fact]
    [Trait("CodeModule", "Promotion")]
    [Trait("Method", "UpdateDiscountCodeAsync")]
    [Trait("UTCID", "UTCID02")]
    [Trait("Type", "A")]
    public async Task UTCID02_UpdateDiscountCodeAsync_NonExisting_ThrowsException()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new PromotionService(context);

        await Assert.ThrowsAsync<Exception>(() =>
            service.UpdateDiscountCodeAsync(
                999,
                new UpdateDiscountCodeDTO
                {
                    Code = "X",
                    DiscountType = "PERCENT",
                    DiscountValue = 1,
                    IsActive = true,
                }
            )
        );
    }

    [Fact]
    [Trait("CodeModule", "Promotion")]
    [Trait("Method", "UpdateDiscountCodeAsync")]
    [Trait("UTCID", "UTCID03")]
    [Trait("Type", "A")]
    public async Task UTCID03_UpdateDiscountCodeAsync_ChangeToDuplicateCode_ThrowsException()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new PromotionService(context);

        var a = await service.CreateDiscountCodeAsync(
            new CreateDiscountCodeDTO
            {
                Code = "A",
                DiscountType = "PERCENT",
                DiscountValue = 1,
                IsActive = true,
            }
        );
        var b = await service.CreateDiscountCodeAsync(
            new CreateDiscountCodeDTO
            {
                Code = "B",
                DiscountType = "PERCENT",
                DiscountValue = 1,
                IsActive = true,
            }
        );

        await Assert.ThrowsAsync<Exception>(() =>
            service.UpdateDiscountCodeAsync(
                b!.DiscountId,
                new UpdateDiscountCodeDTO
                {
                    Code = "a",
                    DiscountType = "PERCENT",
                    DiscountValue = 2,
                    IsActive = true,
                }
            )
        );

        var storedB = await context.DiscountCodes.FindAsync(b!.DiscountId);
        Assert.NotNull(storedB);
        Assert.Equal("B", storedB!.Code);
    }

    [Fact]
    [Trait("CodeModule", "Promotion")]
    [Trait("Method", "UpdateDiscountCodeAsync")]
    [Trait("UTCID", "UTCID04")]
    [Trait("Type", "B")]
    public async Task UTCID04_UpdateDiscountCodeAsync_CodeNormalizedToUppercase()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new PromotionService(context);

        var created = await service.CreateDiscountCodeAsync(
            new CreateDiscountCodeDTO
            {
                Code = "X",
                DiscountType = "PERCENT",
                DiscountValue = 1,
                IsActive = true,
            }
        );

        var updated = await service.UpdateDiscountCodeAsync(
            created!.DiscountId,
            new UpdateDiscountCodeDTO
            {
                Code = "lower",
                DiscountType = "PERCENT",
                DiscountValue = 1,
                IsActive = true,
            }
        );

        Assert.NotNull(updated);
        Assert.Equal("LOWER", updated!.Code);
    }

    [Fact]
    [Trait("CodeModule", "Promotion")]
    [Trait("Method", "UpdateDiscountCodeAsync")]
    [Trait("UTCID", "UTCID05")]
    [Trait("Type", "B")]
    public async Task UTCID05_UpdateDiscountCodeAsync_SameCode_DoesNotTripUniqCheck()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new PromotionService(context);

        var created = await service.CreateDiscountCodeAsync(
            new CreateDiscountCodeDTO
            {
                Code = "SAME",
                DiscountType = "PERCENT",
                DiscountValue = 1,
                IsActive = true,
            }
        );

        var updated = await service.UpdateDiscountCodeAsync(
            created!.DiscountId,
            new UpdateDiscountCodeDTO
            {
                Code = "SAME",
                DiscountType = "PERCENT",
                DiscountValue = 99,
                IsActive = false,
            }
        );

        Assert.NotNull(updated);
        Assert.Equal(99, updated!.DiscountValue);
        Assert.False(updated.IsActive);
    }

    // ─────────────────────────────────────────────
    //  FUNC: ToggleDiscountCodeAsync (5 testcases)
    // ─────────────────────────────────────────────

    [Fact]
    [Trait("CodeModule", "Promotion")]
    [Trait("Method", "ToggleDiscountCodeAsync")]
    [Trait("UTCID", "UTCID01")]
    [Trait("Type", "N")]
    public async Task UTCID01_ToggleDiscountCodeAsync_Existing_FlipsIsActive()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new PromotionService(context);

        var created = await service.CreateDiscountCodeAsync(
            new CreateDiscountCodeDTO
            {
                Code = "T",
                DiscountType = "PERCENT",
                DiscountValue = 1,
                IsActive = true,
            }
        );

        var toggled = await service.ToggleDiscountCodeAsync(created!.DiscountId);
        Assert.NotNull(toggled);
        Assert.False(toggled!.IsActive);
    }

    [Fact]
    [Trait("CodeModule", "Promotion")]
    [Trait("Method", "ToggleDiscountCodeAsync")]
    [Trait("UTCID", "UTCID02")]
    [Trait("Type", "A")]
    public async Task UTCID02_ToggleDiscountCodeAsync_NonExisting_ThrowsException()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new PromotionService(context);

        await Assert.ThrowsAsync<Exception>(() => service.ToggleDiscountCodeAsync(999));
    }

    [Fact]
    [Trait("CodeModule", "Promotion")]
    [Trait("Method", "ToggleDiscountCodeAsync")]
    [Trait("UTCID", "UTCID03")]
    [Trait("Type", "B")]
    public async Task UTCID03_ToggleDiscountCodeAsync_ToggleTwice_ReturnsToOriginal()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new PromotionService(context);

        var created = await service.CreateDiscountCodeAsync(
            new CreateDiscountCodeDTO
            {
                Code = "TT",
                DiscountType = "PERCENT",
                DiscountValue = 1,
                IsActive = true,
            }
        );

        await service.ToggleDiscountCodeAsync(created!.DiscountId);
        var toggledBack = await service.ToggleDiscountCodeAsync(created.DiscountId);

        Assert.NotNull(toggledBack);
        Assert.True(toggledBack!.IsActive);
    }

    [Fact]
    [Trait("CodeModule", "Promotion")]
    [Trait("Method", "ToggleDiscountCodeAsync")]
    [Trait("UTCID", "UTCID04")]
    [Trait("Type", "B")]
    public async Task UTCID04_ToggleDiscountCodeAsync_PersistsToDb()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new PromotionService(context);

        var created = await service.CreateDiscountCodeAsync(
            new CreateDiscountCodeDTO
            {
                Code = "P",
                DiscountType = "PERCENT",
                DiscountValue = 1,
                IsActive = true,
            }
        );

        await service.ToggleDiscountCodeAsync(created!.DiscountId);
        var stored = await context.DiscountCodes.FindAsync(created.DiscountId);
        Assert.NotNull(stored);
        Assert.False(stored!.IsActive);
    }

    [Fact]
    [Trait("CodeModule", "Promotion")]
    [Trait("Method", "ToggleDiscountCodeAsync")]
    [Trait("UTCID", "UTCID05")]
    [Trait("Type", "B")]
    public async Task UTCID05_ToggleDiscountCodeAsync_ReturnsDtoWithSameId()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new PromotionService(context);

        var created = await service.CreateDiscountCodeAsync(
            new CreateDiscountCodeDTO
            {
                Code = "ID",
                DiscountType = "PERCENT",
                DiscountValue = 1,
                IsActive = true,
            }
        );

        var toggled = await service.ToggleDiscountCodeAsync(created!.DiscountId);
        Assert.NotNull(toggled);
        Assert.Equal(created.DiscountId, toggled!.DiscountId);
    }

    // ─────────────────────────────────────────────
    //  FUNC: DeleteDiscountCodeAsync (5 testcases)
    // ─────────────────────────────────────────────

    [Fact]
    [Trait("CodeModule", "Promotion")]
    [Trait("Method", "DeleteDiscountCodeAsync")]
    [Trait("UTCID", "UTCID01")]
    [Trait("Type", "N")]
    public async Task UTCID01_DeleteDiscountCodeAsync_Existing_RemovesRow()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new PromotionService(context);

        var created = await service.CreateDiscountCodeAsync(
            new CreateDiscountCodeDTO
            {
                Code = "DEL",
                DiscountType = "PERCENT",
                DiscountValue = 1,
                IsActive = true,
            }
        );

        await service.DeleteDiscountCodeAsync(created!.DiscountId);

        Assert.Equal(0, await context.DiscountCodes.CountAsync());
    }

    [Fact]
    [Trait("CodeModule", "Promotion")]
    [Trait("Method", "DeleteDiscountCodeAsync")]
    [Trait("UTCID", "UTCID02")]
    [Trait("Type", "A")]
    public async Task UTCID02_DeleteDiscountCodeAsync_NonExisting_NoThrow()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new PromotionService(context);

        await service.DeleteDiscountCodeAsync(999);
        Assert.Equal(0, await context.DiscountCodes.CountAsync());
    }

    [Fact]
    [Trait("CodeModule", "Promotion")]
    [Trait("Method", "DeleteDiscountCodeAsync")]
    [Trait("UTCID", "UTCID03")]
    [Trait("Type", "B")]
    public async Task UTCID03_DeleteDiscountCodeAsync_DeleteTwice_NoThrow()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new PromotionService(context);

        var created = await service.CreateDiscountCodeAsync(
            new CreateDiscountCodeDTO
            {
                Code = "DD",
                DiscountType = "PERCENT",
                DiscountValue = 1,
                IsActive = true,
            }
        );

        await service.DeleteDiscountCodeAsync(created!.DiscountId);
        await service.DeleteDiscountCodeAsync(created.DiscountId);

        Assert.Equal(0, await context.DiscountCodes.CountAsync());
    }

    [Fact]
    [Trait("CodeModule", "Promotion")]
    [Trait("Method", "DeleteDiscountCodeAsync")]
    [Trait("UTCID", "UTCID04")]
    [Trait("Type", "B")]
    public async Task UTCID04_DeleteDiscountCodeAsync_AfterDelete_RowNotFound()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new PromotionService(context);

        var created = await service.CreateDiscountCodeAsync(
            new CreateDiscountCodeDTO
            {
                Code = "G",
                DiscountType = "PERCENT",
                DiscountValue = 1,
                IsActive = true,
            }
        );

        await service.DeleteDiscountCodeAsync(created!.DiscountId);
        var stored = await context.DiscountCodes.FindAsync(created.DiscountId);
        Assert.Null(stored);
    }

    [Fact]
    [Trait("CodeModule", "Promotion")]
    [Trait("Method", "DeleteDiscountCodeAsync")]
    [Trait("UTCID", "UTCID05")]
    [Trait("Type", "B")]
    public async Task UTCID05_DeleteDiscountCodeAsync_OnlyDeletesTarget()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new PromotionService(context);

        var a = await service.CreateDiscountCodeAsync(
            new CreateDiscountCodeDTO
            {
                Code = "A",
                DiscountType = "PERCENT",
                DiscountValue = 1,
                IsActive = true,
            }
        );
        var b = await service.CreateDiscountCodeAsync(
            new CreateDiscountCodeDTO
            {
                Code = "B",
                DiscountType = "PERCENT",
                DiscountValue = 1,
                IsActive = true,
            }
        );

        await service.DeleteDiscountCodeAsync(a!.DiscountId);

        Assert.Equal(1, await context.DiscountCodes.CountAsync());
        var remaining = await context.DiscountCodes.SingleAsync();
        Assert.Equal(b!.DiscountId, remaining.DiscountId);
    }
}
