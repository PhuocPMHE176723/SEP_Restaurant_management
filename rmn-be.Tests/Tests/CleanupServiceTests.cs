using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SEP_Restaurant_management.Core.Middlewares;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Services.Implementation;
using Xunit;

namespace rmn_be.Tests;

public class CleanupServicePostTests
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
    //  FUNC: DoDailyCleanupAsync (5 testcases)
    // ─────────────────────────────────────────────

    [Fact]
    [Trait("CodeModule", "Cleanup")]
    [Trait("Method", "DoDailyCleanupAsync")]
    [Trait("UTCID", "UTCID01")]
    [Trait("Type", "N")]
    public async Task UTCID01_DoDailyCleanupAsync_StaleOpenOrder_CancelsOrderAndReleasesTable()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new CleanupService(context);

        var today = DateTimeHelper.VietnamNow().Date;

        var table = new DiningTable
        {
            TableId = 1,
            TableCode = "T1",
            Capacity = 4,
            Status = "OCCUPIED",
        };
        context.DiningTables.Add(table);
        context.Orders.Add(
            new Order
            {
                OrderId = 1,
                OrderCode = "OD-1",
                TableId = 1,
                Status = "OPEN",
                OpenedAt = today.AddDays(-1).AddHours(10),
                Note = "x",
            }
        );
        await context.SaveChangesAsync();

        var (ordersCancelled, reservationsCleared, tablesReleased) =
            await service.DoDailyCleanupAsync();

        Assert.Equal(1, ordersCancelled);
        Assert.Equal(0, reservationsCleared);
        Assert.Equal(2, tablesReleased);

        var storedOrder = await context.Orders.FindAsync((long)1);
        Assert.Equal("CANCELLED", storedOrder!.Status);
        Assert.NotNull(storedOrder.ClosedAt);

        var storedTable = await context.DiningTables.FindAsync(1);
        Assert.Equal("AVAILABLE", storedTable!.Status);
    }

    [Fact]
    [Trait("CodeModule", "Cleanup")]
    [Trait("Method", "DoDailyCleanupAsync")]
    [Trait("UTCID", "UTCID02")]
    [Trait("Type", "N")]
    public async Task UTCID02_DoDailyCleanupAsync_StaleConfirmedReservation_MarksNoShowAndReleasesTable()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new CleanupService(context);

        var today = DateTimeHelper.VietnamNow().Date;

        context.DiningTables.Add(
            new DiningTable
            {
                TableId = 1,
                TableCode = "T1",
                Capacity = 4,
                Status = "RESERVED",
            }
        );
        context.Reservations.Add(
            new Reservation
            {
                ReservationId = 1,
                CustomerId = 1,
                CustomerName = "C",
                CustomerPhone = "090",
                PartySize = 2,
                ReservedAt = today.AddDays(-1).AddHours(19),
                DurationMinutes = 90,
                Status = "CONFIRMED",
                CreatedAt = today.AddDays(-2),
                TableId = 1,
            }
        );
        await context.SaveChangesAsync();

        var (ordersCancelled, reservationsCleared, tablesReleased) =
            await service.DoDailyCleanupAsync();

        Assert.Equal(0, ordersCancelled);
        Assert.Equal(1, reservationsCleared);
        Assert.Equal(2, tablesReleased);

        var stored = await context.Reservations.FindAsync((long)1);
        Assert.Equal("NO_SHOW", stored!.Status);

        var table = await context.DiningTables.FindAsync(1);
        Assert.Equal("AVAILABLE", table!.Status);
    }

    [Fact]
    [Trait("CodeModule", "Cleanup")]
    [Trait("Method", "DoDailyCleanupAsync")]
    [Trait("UTCID", "UTCID03")]
    [Trait("Type", "B")]
    public async Task UTCID03_DoDailyCleanupAsync_StuckOccupiedTableWithoutTodayActivity_ReleasesTable()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new CleanupService(context);

        context.DiningTables.Add(
            new DiningTable
            {
                TableId = 1,
                TableCode = "T1",
                Capacity = 4,
                Status = "OCCUPIED",
            }
        );
        await context.SaveChangesAsync();

        var (ordersCancelled, reservationsCleared, tablesReleased) =
            await service.DoDailyCleanupAsync();

        Assert.Equal(0, ordersCancelled);
        Assert.Equal(0, reservationsCleared);
        Assert.Equal(1, tablesReleased);

        var table = await context.DiningTables.FindAsync(1);
        Assert.Equal("AVAILABLE", table!.Status);
    }

    [Fact]
    [Trait("CodeModule", "Cleanup")]
    [Trait("Method", "DoDailyCleanupAsync")]
    [Trait("UTCID", "UTCID04")]
    [Trait("Type", "A")]
    public async Task UTCID04_DoDailyCleanupAsync_TodayOpenOrder_IsNotCancelled()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new CleanupService(context);

        var today = DateTimeHelper.VietnamNow().Date;

        context.DiningTables.Add(
            new DiningTable
            {
                TableId = 1,
                TableCode = "T1",
                Capacity = 4,
                Status = "OCCUPIED",
            }
        );
        context.Orders.Add(
            new Order
            {
                OrderId = 1,
                OrderCode = "OD-1",
                TableId = 1,
                Status = "OPEN",
                OpenedAt = today.AddHours(9),
                Note = "x",
            }
        );
        await context.SaveChangesAsync();

        var (ordersCancelled, reservationsCleared, tablesReleased) =
            await service.DoDailyCleanupAsync();

        Assert.Equal(0, ordersCancelled);
        Assert.Equal(0, reservationsCleared);
        Assert.Equal(0, tablesReleased);

        var order = await context.Orders.FindAsync((long)1);
        Assert.Equal("OPEN", order!.Status);

        var table = await context.DiningTables.FindAsync(1);
        Assert.Equal("OCCUPIED", table!.Status);
    }

    [Fact]
    [Trait("CodeModule", "Cleanup")]
    [Trait("Method", "DoDailyCleanupAsync")]
    [Trait("UTCID", "UTCID05")]
    [Trait("Type", "B")]
    public async Task UTCID05_DoDailyCleanupAsync_StaleOrderReleasesExtraTablesFromNote()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        var service = new CleanupService(context);

        var today = DateTimeHelper.VietnamNow().Date;

        context.DiningTables.Add(
            new DiningTable
            {
                TableId = 1,
                TableCode = "T1",
                Capacity = 4,
                Status = "OCCUPIED",
            }
        );
        context.DiningTables.Add(
            new DiningTable
            {
                TableId = 2,
                TableCode = "T2",
                Capacity = 4,
                Status = "RESERVED",
            }
        );
        context.DiningTables.Add(
            new DiningTable
            {
                TableId = 3,
                TableCode = "T3",
                Capacity = 4,
                Status = "OCCUPIED",
            }
        );
        context.Orders.Add(
            new Order
            {
                OrderId = 1,
                OrderCode = "OD-1",
                TableId = 1,
                Status = "SERVED",
                OpenedAt = today.AddDays(-1).AddHours(10),
                Note = "abc [Tables:2,3]",
            }
        );
        await context.SaveChangesAsync();

        var (ordersCancelled, reservationsCleared, tablesReleased) =
            await service.DoDailyCleanupAsync();

        Assert.Equal(1, ordersCancelled);
        Assert.Equal(0, reservationsCleared);
        Assert.Equal(6, tablesReleased);

        Assert.Equal("AVAILABLE", (await context.DiningTables.FindAsync(1))!.Status);
        Assert.Equal("AVAILABLE", (await context.DiningTables.FindAsync(2))!.Status);
        Assert.Equal("AVAILABLE", (await context.DiningTables.FindAsync(3))!.Status);
    }
}
