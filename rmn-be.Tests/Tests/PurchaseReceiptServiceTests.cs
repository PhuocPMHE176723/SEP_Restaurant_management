using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Services.Implementation;
using Xunit;

namespace rmn_be.Tests;

public class PurchaseReceiptServicePostTests
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

    private static async Task SeedSupplierAsync(SepDatabaseContext context, int supplierId = 1)
    {
        context.Suppliers.Add(
            new Supplier
            {
                SupplierId = supplierId,
                SupplierName = "Supplier",
                IsActive = true,
            }
        );
        await context.SaveChangesAsync();
    }

    private static async Task SeedIngredientAsync(
        SepDatabaseContext context,
        long ingredientId,
        string name = "Sugar",
        string unit = "kg"
    )
    {
        context.Ingredients.Add(
            new Ingredient
            {
                IngredientId = ingredientId,
                IngredientName = name,
                Unit = unit,
                IsActive = true,
            }
        );
        await context.SaveChangesAsync();
    }

    // ─────────────────────────────────────────────
    //  FUNC: CreateAsync (5 testcases)
    // ─────────────────────────────────────────────

    [Fact]
    [Trait("CodeModule", "PurchaseReceipt")]
    [Trait("Method", "CreateAsync")]
    [Trait("UTCID", "UTCID01")]
    [Trait("Type", "N")]
    public async Task UTCID01_CreateAsync_Draft_AccumulatesTotalAndDoesNotCreateStockMovements()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        await SeedSupplierAsync(context, supplierId: 1);
        await SeedIngredientAsync(context, ingredientId: 10, name: "Sugar", unit: "kg");
        await SeedIngredientAsync(context, ingredientId: 11, name: "Milk", unit: "l");

        var service = new PurchaseReceiptService(context);

        var created = await service.CreateAsync(
            new CreatePurchaseReceiptRequest
            {
                SupplierId = 1,
                Status = "DRAFT",
                Note = "note",
                Items =
                [
                    new CreatePurchaseReceiptItemRequest
                    {
                        IngredientId = 10,
                        Quantity = 2,
                        UnitCost = 100,
                    },
                    new CreatePurchaseReceiptItemRequest
                    {
                        IngredientId = 11,
                        Quantity = 3,
                        UnitCost = 50,
                    },
                ],
            },
            createdByStaffId: 99
        );

        Assert.NotNull(created);
        Assert.StartsWith("PR", created.ReceiptCode);
        Assert.Equal("DRAFT", created.Status);
        Assert.Equal(2 * 100 + 3 * 50, created.TotalAmount);
        Assert.Equal(99, created.CreatedByStaffId);
        Assert.Equal("note", created.Note);
        Assert.Equal(2, created.Items.Count);
        Assert.Equal(0, await context.StockMovements.CountAsync());
    }

    [Fact]
    [Trait("CodeModule", "PurchaseReceipt")]
    [Trait("Method", "CreateAsync")]
    [Trait("UTCID", "UTCID02")]
    [Trait("Type", "N")]
    public async Task UTCID02_CreateAsync_Received_CreatesStockMovementsForEachItem()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        await SeedSupplierAsync(context, supplierId: 1);
        await SeedIngredientAsync(context, ingredientId: 10);
        await SeedIngredientAsync(context, ingredientId: 11);

        var service = new PurchaseReceiptService(context);

        var created = await service.CreateAsync(
            new CreatePurchaseReceiptRequest
            {
                SupplierId = 1,
                Status = "RECEIVED",
                Items =
                [
                    new CreatePurchaseReceiptItemRequest
                    {
                        IngredientId = 10,
                        Quantity = 2,
                        UnitCost = 100,
                    },
                    new CreatePurchaseReceiptItemRequest
                    {
                        IngredientId = 11,
                        Quantity = 3,
                        UnitCost = 50,
                    },
                ],
            },
            createdByStaffId: 77
        );

        Assert.Equal("RECEIVED", created.Status);
        Assert.Equal(2, await context.StockMovements.CountAsync());

        var movements = await context.StockMovements.OrderBy(m => m.IngredientId).ToListAsync();
        Assert.All(
            movements,
            m =>
            {
                Assert.Equal("IN", m.MovementType);
                Assert.Equal("PURCHASE_RECEIPT", m.RefType);
                Assert.Equal(created.ReceiptId, m.RefId);
                Assert.Equal(77, m.CreatedByStaffId);
                Assert.NotNull(m.Note);
            }
        );
        Assert.Equal(10, movements[0].IngredientId);
        Assert.Equal(2, movements[0].Quantity);
        Assert.Equal(11, movements[1].IngredientId);
        Assert.Equal(3, movements[1].Quantity);
    }

    [Fact]
    [Trait("CodeModule", "PurchaseReceipt")]
    [Trait("Method", "CreateAsync")]
    [Trait("UTCID", "UTCID03")]
    [Trait("Type", "B")]
    public async Task UTCID03_CreateAsync_EmptyItems_AllowsAndCreatesZeroTotalReceipt()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        var service = new PurchaseReceiptService(context);

        var created = await service.CreateAsync(
            new CreatePurchaseReceiptRequest
            {
                SupplierId = null,
                Status = "DRAFT",
                Items = [],
            },
            createdByStaffId: null
        );

        Assert.Equal(0, created.TotalAmount);
        Assert.Empty(created.Items);
        Assert.Equal(0, await context.StockMovements.CountAsync());
    }

    [Fact]
    [Trait("CodeModule", "PurchaseReceipt")]
    [Trait("Method", "CreateAsync")]
    [Trait("UTCID", "UTCID04")]
    [Trait("Type", "B")]
    public async Task UTCID04_CreateAsync_NullStaffId_PersistsNullCreatedByStaffId()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        await SeedIngredientAsync(context, ingredientId: 10);

        var service = new PurchaseReceiptService(context);

        var created = await service.CreateAsync(
            new CreatePurchaseReceiptRequest
            {
                Status = "DRAFT",
                Items =
                [
                    new CreatePurchaseReceiptItemRequest
                    {
                        IngredientId = 10,
                        Quantity = 1,
                        UnitCost = 1,
                    },
                ],
            },
            createdByStaffId: null
        );

        Assert.Null(created.CreatedByStaffId);
        var stored = await context.PurchaseReceipts.FindAsync(created.ReceiptId);
        Assert.NotNull(stored);
        Assert.Null(stored!.CreatedByStaffId);
    }

    [Fact]
    [Trait("CodeModule", "PurchaseReceipt")]
    [Trait("Method", "CreateAsync")]
    [Trait("UTCID", "UTCID05")]
    [Trait("Type", "B")]
    public async Task UTCID05_CreateAsync_Received_StaffIdPropagatesToStockMovements()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        await SeedIngredientAsync(context, ingredientId: 10);

        var service = new PurchaseReceiptService(context);

        var created = await service.CreateAsync(
            new CreatePurchaseReceiptRequest
            {
                Status = "RECEIVED",
                Items =
                [
                    new CreatePurchaseReceiptItemRequest
                    {
                        IngredientId = 10,
                        Quantity = 1,
                        UnitCost = 1,
                    },
                ],
            },
            createdByStaffId: 123
        );

        var movement = await context.StockMovements.SingleAsync();
        Assert.Equal(created.ReceiptId, movement.RefId);
        Assert.Equal(123, movement.CreatedByStaffId);
    }

    // ─────────────────────────────────────────────
    //  FUNC: UpdateStatusAsync (5 testcases)
    // ─────────────────────────────────────────────

    [Fact]
    [Trait("CodeModule", "PurchaseReceipt")]
    [Trait("Method", "UpdateStatusAsync")]
    [Trait("UTCID", "UTCID01")]
    [Trait("Type", "N")]
    public async Task UTCID01_UpdateStatusAsync_DraftToReceived_CreatesStockMovements_ReturnsTrue()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        await SeedIngredientAsync(context, ingredientId: 10);
        await SeedIngredientAsync(context, ingredientId: 11);

        var service = new PurchaseReceiptService(context);

        var created = await service.CreateAsync(
            new CreatePurchaseReceiptRequest
            {
                Status = "DRAFT",
                Items =
                [
                    new CreatePurchaseReceiptItemRequest
                    {
                        IngredientId = 10,
                        Quantity = 2,
                        UnitCost = 1,
                    },
                    new CreatePurchaseReceiptItemRequest
                    {
                        IngredientId = 11,
                        Quantity = 3,
                        UnitCost = 1,
                    },
                ],
            },
            createdByStaffId: 88
        );

        var ok = await service.UpdateStatusAsync(created.ReceiptId, "RECEIVED");

        Assert.True(ok);
        Assert.Equal(2, await context.StockMovements.CountAsync());
        var stored = await context.PurchaseReceipts.FindAsync(created.ReceiptId);
        Assert.Equal("RECEIVED", stored!.Status);
    }

    [Fact]
    [Trait("CodeModule", "PurchaseReceipt")]
    [Trait("Method", "UpdateStatusAsync")]
    [Trait("UTCID", "UTCID02")]
    [Trait("Type", "A")]
    public async Task UTCID02_UpdateStatusAsync_NotFound_ReturnsFalse()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        var service = new PurchaseReceiptService(context);

        var ok = await service.UpdateStatusAsync(id: 999, status: "RECEIVED");

        Assert.False(ok);
    }

    [Fact]
    [Trait("CodeModule", "PurchaseReceipt")]
    [Trait("Method", "UpdateStatusAsync")]
    [Trait("UTCID", "UTCID03")]
    [Trait("Type", "A")]
    public async Task UTCID03_UpdateStatusAsync_AlreadyReceived_ThrowsInvalidOperationException()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        await SeedIngredientAsync(context, ingredientId: 10);

        var service = new PurchaseReceiptService(context);

        var created = await service.CreateAsync(
            new CreatePurchaseReceiptRequest
            {
                Status = "RECEIVED",
                Items =
                [
                    new CreatePurchaseReceiptItemRequest
                    {
                        IngredientId = 10,
                        Quantity = 1,
                        UnitCost = 1,
                    },
                ],
            },
            createdByStaffId: 1
        );

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.UpdateStatusAsync(created.ReceiptId, "CANCELLED")
        );
    }

    [Fact]
    [Trait("CodeModule", "PurchaseReceipt")]
    [Trait("Method", "UpdateStatusAsync")]
    [Trait("UTCID", "UTCID04")]
    [Trait("Type", "A")]
    public async Task UTCID04_UpdateStatusAsync_AlreadyCancelled_ThrowsInvalidOperationException()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        await SeedIngredientAsync(context, ingredientId: 10);

        var service = new PurchaseReceiptService(context);

        var created = await service.CreateAsync(
            new CreatePurchaseReceiptRequest
            {
                Status = "DRAFT",
                Items =
                [
                    new CreatePurchaseReceiptItemRequest
                    {
                        IngredientId = 10,
                        Quantity = 1,
                        UnitCost = 1,
                    },
                ],
            },
            createdByStaffId: 1
        );

        var cancelled = await service.UpdateStatusAsync(created.ReceiptId, "CANCELLED");
        Assert.True(cancelled);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.UpdateStatusAsync(created.ReceiptId, "RECEIVED")
        );
    }

    [Fact]
    [Trait("CodeModule", "PurchaseReceipt")]
    [Trait("Method", "UpdateStatusAsync")]
    [Trait("UTCID", "UTCID05")]
    [Trait("Type", "B")]
    public async Task UTCID05_UpdateStatusAsync_DraftToCancelled_DoesNotCreateStockMovements()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        await SeedIngredientAsync(context, ingredientId: 10);

        var service = new PurchaseReceiptService(context);

        var created = await service.CreateAsync(
            new CreatePurchaseReceiptRequest
            {
                Status = "DRAFT",
                Items =
                [
                    new CreatePurchaseReceiptItemRequest
                    {
                        IngredientId = 10,
                        Quantity = 1,
                        UnitCost = 1,
                    },
                ],
            },
            createdByStaffId: 5
        );

        var ok = await service.UpdateStatusAsync(created.ReceiptId, "CANCELLED");

        Assert.True(ok);
        Assert.Equal(0, await context.StockMovements.CountAsync());
        var stored = await context.PurchaseReceipts.FindAsync(created.ReceiptId);
        Assert.Equal("CANCELLED", stored!.Status);
    }
}
