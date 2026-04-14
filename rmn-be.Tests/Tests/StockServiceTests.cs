using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Services.Implementation;
using Xunit;

namespace rmn_be.Tests;

public class StockServicePostTests
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
    //  FUNC: CreateManualAdjustmentAsync (5 testcases)
    // ─────────────────────────────────────────────

    [Fact]
    [Trait("CodeModule", "Stock")]
    [Trait("Method", "CreateManualAdjustmentAsync")]
    [Trait("UTCID", "UTCID01")]
    [Trait("Type", "N")]
    public async Task UTCID01_CreateManualAdjustmentAsync_In_Adjustment_CreatesMovement()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new StockService(context);

        var ingredient = new Ingredient
        {
            IngredientId = 1,
            IngredientName = "Sugar",
            Unit = "kg",
            IsActive = true,
        };
        context.Ingredients.Add(ingredient);
        await context.SaveChangesAsync();

        var result = await service.CreateManualAdjustmentAsync(
            new ManualAdjustmentRequest
            {
                IngredientId = 1,
                MovementType = "IN",
                Quantity = 5,
                Note = "restock",
            },
            staffId: 123
        );

        Assert.Equal(1, result.IngredientId);
        Assert.Equal("IN", result.MovementType);
        Assert.Equal(5, result.Quantity);
        Assert.Equal("ADJUSTMENT", result.RefType);
        Assert.Equal("Sugar", result.IngredientName);
        Assert.Equal("kg", result.Unit);
        Assert.Equal(123, result.CreatedByStaffId);
        Assert.Equal(1, await context.StockMovements.CountAsync());
    }

    [Fact]
    [Trait("CodeModule", "Stock")]
    [Trait("Method", "CreateManualAdjustmentAsync")]
    [Trait("UTCID", "UTCID02")]
    [Trait("Type", "A")]
    public async Task UTCID02_CreateManualAdjustmentAsync_IngredientNotFound_ThrowsInvalidOperationException()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new StockService(context);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.CreateManualAdjustmentAsync(
                new ManualAdjustmentRequest
                {
                    IngredientId = 999,
                    MovementType = "IN",
                    Quantity = 1,
                    Note = "x",
                },
                staffId: null
            )
        );
    }

    [Fact]
    [Trait("CodeModule", "Stock")]
    [Trait("Method", "CreateManualAdjustmentAsync")]
    [Trait("UTCID", "UTCID03")]
    [Trait("Type", "A")]
    public async Task UTCID03_CreateManualAdjustmentAsync_Out_InactiveIngredient_ThrowsInvalidOperationException()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new StockService(context);

        context.Ingredients.Add(
            new Ingredient
            {
                IngredientId = 1,
                IngredientName = "Sugar",
                Unit = "kg",
                IsActive = false,
            }
        );
        await context.SaveChangesAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.CreateManualAdjustmentAsync(
                new ManualAdjustmentRequest
                {
                    IngredientId = 1,
                    MovementType = "OUT",
                    Quantity = 1,
                    Note = "x",
                },
                staffId: null
            )
        );
    }

    [Fact]
    [Trait("CodeModule", "Stock")]
    [Trait("Method", "CreateManualAdjustmentAsync")]
    [Trait("UTCID", "UTCID04")]
    [Trait("Type", "A")]
    public async Task UTCID04_CreateManualAdjustmentAsync_Out_InsufficientStock_ThrowsInvalidOperationException()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new StockService(context);

        context.Ingredients.Add(
            new Ingredient
            {
                IngredientId = 1,
                IngredientName = "Sugar",
                Unit = "kg",
                IsActive = true,
            }
        );
        context.StockMovements.Add(
            new StockMovement
            {
                IngredientId = 1,
                MovementType = "IN",
                Quantity = 2,
                RefType = "ADJUSTMENT",
                MovedAt = DateTime.UtcNow.AddDays(-1),
                Note = "seed",
            }
        );
        await context.SaveChangesAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.CreateManualAdjustmentAsync(
                new ManualAdjustmentRequest
                {
                    IngredientId = 1,
                    MovementType = "OUT",
                    Quantity = 3,
                    Note = "x",
                },
                staffId: null
            )
        );
    }

    [Fact]
    [Trait("CodeModule", "Stock")]
    [Trait("Method", "CreateManualAdjustmentAsync")]
    [Trait("UTCID", "UTCID05")]
    [Trait("Type", "B")]
    public async Task UTCID05_CreateManualAdjustmentAsync_Out_ExactStock_Succeeds()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new StockService(context);

        context.Ingredients.Add(
            new Ingredient
            {
                IngredientId = 1,
                IngredientName = "Sugar",
                Unit = "kg",
                IsActive = true,
            }
        );
        context.StockMovements.Add(
            new StockMovement
            {
                IngredientId = 1,
                MovementType = "IN",
                Quantity = 2,
                RefType = "ADJUSTMENT",
                MovedAt = DateTime.UtcNow.AddDays(-1),
                Note = "seed",
            }
        );
        await context.SaveChangesAsync();

        var result = await service.CreateManualAdjustmentAsync(
            new ManualAdjustmentRequest
            {
                IngredientId = 1,
                MovementType = "OUT",
                Quantity = 2,
                Note = "x",
            },
            staffId: null
        );

        Assert.Equal("OUT", result.MovementType);
        Assert.Equal(2, result.Quantity);
        Assert.Equal(2, await context.StockMovements.CountAsync());
    }
}
