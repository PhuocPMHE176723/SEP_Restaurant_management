using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Services.Implementation;
using Xunit;

namespace rmn_be.Tests;

public class IngredientServicePostTests
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
    //  FUNC: CreateAsync (5 testcases)
    // ─────────────────────────────────────────────

    [Fact]
    [Trait("CodeModule", "Ingredient")]
    [Trait("Method", "CreateAsync")]
    [Trait("UTCID", "UTCID01")]
    [Trait("Type", "N")]
    public async Task UTCID01_CreateAsync_ValidInput_CreatesIngredient()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new IngredientService(context);

        var dto = new CreateIngredientRequest { IngredientName = "Sugar", Unit = "kg" };
        var result = await service.CreateAsync(dto);

        Assert.Equal("Sugar", result.IngredientName);
        Assert.Equal("kg", result.Unit);
        Assert.True(result.IsActive);

        var stored = await context.Ingredients.SingleAsync(i => i.IngredientName == "Sugar");
        Assert.True(stored.IsActive);
    }

    [Fact]
    [Trait("CodeModule", "Ingredient")]
    [Trait("Method", "CreateAsync")]
    [Trait("UTCID", "UTCID02")]
    [Trait("Type", "A")]
    public async Task UTCID02_CreateAsync_EmptyName_ThrowsInvalidOperationException()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new IngredientService(context);

        var dto = new CreateIngredientRequest { IngredientName = "   ", Unit = "kg" };
        await Assert.ThrowsAsync<InvalidOperationException>(() => service.CreateAsync(dto));
    }

    [Fact]
    [Trait("CodeModule", "Ingredient")]
    [Trait("Method", "CreateAsync")]
    [Trait("UTCID", "UTCID03")]
    [Trait("Type", "A")]
    public async Task UTCID03_CreateAsync_DuplicateNameIgnoringCaseAndSpaces_ThrowsInvalidOperationException()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new IngredientService(context);

        await service.CreateAsync(
            new CreateIngredientRequest { IngredientName = "Sugar", Unit = "kg" }
        );

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.CreateAsync(
                new CreateIngredientRequest { IngredientName = "  sUgAr ", Unit = "g" }
            )
        );
    }

    [Fact]
    [Trait("CodeModule", "Ingredient")]
    [Trait("Method", "CreateAsync")]
    [Trait("UTCID", "UTCID04")]
    [Trait("Type", "B")]
    public async Task UTCID04_CreateAsync_NameHasSpaces_TrimsName()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new IngredientService(context);

        var result = await service.CreateAsync(
            new CreateIngredientRequest { IngredientName = "  Salt  ", Unit = "g" }
        );

        Assert.Equal("Salt", result.IngredientName);
        Assert.NotNull(await context.Ingredients.SingleAsync(i => i.IngredientName == "Salt"));
    }

    [Fact]
    [Trait("CodeModule", "Ingredient")]
    [Trait("Method", "CreateAsync")]
    [Trait("UTCID", "UTCID05")]
    [Trait("Type", "B")]
    public async Task UTCID05_CreateAsync_UnitEmpty_AllowsEmptyUnit()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new IngredientService(context);

        var result = await service.CreateAsync(
            new CreateIngredientRequest { IngredientName = "Pepper", Unit = "" }
        );

        Assert.Equal("Pepper", result.IngredientName);
        Assert.Equal("", result.Unit);
    }

    // ─────────────────────────────────────────────
    //  FUNC: UpdateAsync (5 testcases)
    // ─────────────────────────────────────────────

    [Fact]
    [Trait("CodeModule", "Ingredient")]
    [Trait("Method", "UpdateAsync")]
    [Trait("UTCID", "UTCID01")]
    [Trait("Type", "N")]
    public async Task UTCID01_UpdateAsync_ExistingId_UpdatesFields_ReturnsTrue()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new IngredientService(context);

        var created = await service.CreateAsync(
            new CreateIngredientRequest { IngredientName = "Flour", Unit = "kg" }
        );

        var ok = await service.UpdateAsync(
            created.IngredientId,
            new UpdateIngredientRequest
            {
                IngredientName = "Flour Premium",
                Unit = "g",
                IsActive = false,
            }
        );

        Assert.True(ok);
        var stored = await context.Ingredients.FindAsync(created.IngredientId);
        Assert.NotNull(stored);
        Assert.Equal("Flour Premium", stored!.IngredientName);
        Assert.Equal("g", stored.Unit);
        Assert.False(stored.IsActive);
    }

    [Fact]
    [Trait("CodeModule", "Ingredient")]
    [Trait("Method", "UpdateAsync")]
    [Trait("UTCID", "UTCID02")]
    [Trait("Type", "A")]
    public async Task UTCID02_UpdateAsync_NonExistingId_ReturnsFalse()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new IngredientService(context);

        var ok = await service.UpdateAsync(
            999,
            new UpdateIngredientRequest { IngredientName = "X", Unit = "kg" }
        );

        Assert.False(ok);
    }

    [Fact]
    [Trait("CodeModule", "Ingredient")]
    [Trait("Method", "UpdateAsync")]
    [Trait("UTCID", "UTCID03")]
    [Trait("Type", "A")]
    public async Task UTCID03_UpdateAsync_EmptyName_ThrowsInvalidOperationException()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new IngredientService(context);

        var created = await service.CreateAsync(
            new CreateIngredientRequest { IngredientName = "Oil", Unit = "ml" }
        );

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.UpdateAsync(
                created.IngredientId,
                new UpdateIngredientRequest { IngredientName = "   " }
            )
        );
    }

    [Fact]
    [Trait("CodeModule", "Ingredient")]
    [Trait("Method", "UpdateAsync")]
    [Trait("UTCID", "UTCID04")]
    [Trait("Type", "A")]
    public async Task UTCID04_UpdateAsync_DuplicateName_ThrowsInvalidOperationException()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new IngredientService(context);

        var a = await service.CreateAsync(
            new CreateIngredientRequest { IngredientName = "A", Unit = "kg" }
        );
        var b = await service.CreateAsync(
            new CreateIngredientRequest { IngredientName = "B", Unit = "kg" }
        );

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.UpdateAsync(
                b.IngredientId,
                new UpdateIngredientRequest { IngredientName = " a " }
            )
        );

        var storedB = await context.Ingredients.FindAsync(b.IngredientId);
        Assert.NotNull(storedB);
        Assert.Equal("B", storedB!.IngredientName);
    }

    [Fact]
    [Trait("CodeModule", "Ingredient")]
    [Trait("Method", "UpdateAsync")]
    [Trait("UTCID", "UTCID05")]
    [Trait("Type", "B")]
    public async Task UTCID05_UpdateAsync_SameName_NoUniqCheck_UpdatesOtherFields()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new IngredientService(context);

        var created = await service.CreateAsync(
            new CreateIngredientRequest { IngredientName = "Milk", Unit = "ml" }
        );

        var ok = await service.UpdateAsync(
            created.IngredientId,
            new UpdateIngredientRequest { IngredientName = "Milk", Unit = "l" }
        );

        Assert.True(ok);
        var stored = await context.Ingredients.FindAsync(created.IngredientId);
        Assert.NotNull(stored);
        Assert.Equal("Milk", stored!.IngredientName);
        Assert.Equal("l", stored.Unit);
    }

    // ─────────────────────────────────────────────
    //  FUNC: DeleteAsync (5 testcases)
    // ─────────────────────────────────────────────

    [Fact]
    [Trait("CodeModule", "Ingredient")]
    [Trait("Method", "DeleteAsync")]
    [Trait("UTCID", "UTCID01")]
    [Trait("Type", "N")]
    public async Task UTCID01_DeleteAsync_ExistingId_SoftDeletes_ReturnsTrue()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new IngredientService(context);

        var created = await service.CreateAsync(
            new CreateIngredientRequest { IngredientName = "Butter", Unit = "g" }
        );

        var ok = await service.DeleteAsync(created.IngredientId);

        Assert.True(ok);
        var stored = await context.Ingredients.FindAsync(created.IngredientId);
        Assert.NotNull(stored);
        Assert.False(stored!.IsActive);
    }

    [Fact]
    [Trait("CodeModule", "Ingredient")]
    [Trait("Method", "DeleteAsync")]
    [Trait("UTCID", "UTCID02")]
    [Trait("Type", "A")]
    public async Task UTCID02_DeleteAsync_NonExistingId_ReturnsFalse()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new IngredientService(context);

        var ok = await service.DeleteAsync(999);

        Assert.False(ok);
    }

    [Fact]
    [Trait("CodeModule", "Ingredient")]
    [Trait("Method", "DeleteAsync")]
    [Trait("UTCID", "UTCID03")]
    [Trait("Type", "B")]
    public async Task UTCID03_DeleteAsync_AlreadyInactive_ReturnsTrue()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new IngredientService(context);

        var created = await service.CreateAsync(
            new CreateIngredientRequest { IngredientName = "Cheese", Unit = "g" }
        );

        var stored = await context.Ingredients.FindAsync(created.IngredientId);
        Assert.NotNull(stored);
        stored!.IsActive = false;
        await context.SaveChangesAsync();

        var ok = await service.DeleteAsync(created.IngredientId);
        Assert.True(ok);
    }

    [Fact]
    [Trait("CodeModule", "Ingredient")]
    [Trait("Method", "DeleteAsync")]
    [Trait("UTCID", "UTCID04")]
    [Trait("Type", "B")]
    public async Task UTCID04_DeleteAsync_ThenGetById_ReturnsInactive()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new IngredientService(context);

        var created = await service.CreateAsync(
            new CreateIngredientRequest { IngredientName = "Honey", Unit = "ml" }
        );

        await service.DeleteAsync(created.IngredientId);
        var stored = await context.Ingredients.FindAsync(created.IngredientId);
        Assert.NotNull(stored);
        Assert.False(stored!.IsActive);
    }

    [Fact]
    [Trait("CodeModule", "Ingredient")]
    [Trait("Method", "DeleteAsync")]
    [Trait("UTCID", "UTCID05")]
    [Trait("Type", "B")]
    public async Task UTCID05_DeleteAsync_DoesNotRemoveRow()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new IngredientService(context);

        var created = await service.CreateAsync(
            new CreateIngredientRequest { IngredientName = "Vinegar", Unit = "ml" }
        );

        await service.DeleteAsync(created.IngredientId);
        var count = await context.Ingredients.CountAsync();
        Assert.Equal(1, count);
    }
}
