using System;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Moq;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Services.Implementation;
using Xunit;

namespace rmn_be.Tests;

public class KitchenServicePostTests
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

    private static async Task SeedOrderWithItemsAsync(
        SepDatabaseContext context,
        long orderId,
        string orderStatus,
        (long orderItemId, string status) itemA,
        (long orderItemId, string status) itemB
    )
    {
        var menu = new MenuItem
        {
            ItemId = 1,
            CategoryId = 1,
            ItemName = "Item",
            BasePrice = 10000,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
        };
        context.MenuItems.Add(menu);

        var order = new Order
        {
            OrderId = orderId,
            OrderCode = $"OD-{orderId}",
            Status = orderStatus,
            OrderType = "DINE_IN",
            OpenedAt = DateTime.UtcNow,
        };
        context.Orders.Add(order);

        context.OrderItems.Add(
            new OrderItem
            {
                OrderItemId = itemA.orderItemId,
                OrderId = orderId,
                Order = order,
                ItemId = 1,
                MenuItem = menu,
                ItemNameSnapshot = "Item",
                Quantity = 1,
                UnitPrice = 10000,
                DiscountAmount = 0,
                Status = itemA.status,
                CreatedAt = DateTime.UtcNow.AddMinutes(-2),
            }
        );

        context.OrderItems.Add(
            new OrderItem
            {
                OrderItemId = itemB.orderItemId,
                OrderId = orderId,
                Order = order,
                ItemId = 1,
                MenuItem = menu,
                ItemNameSnapshot = "Item",
                Quantity = 1,
                UnitPrice = 10000,
                DiscountAmount = 0,
                Status = itemB.status,
                CreatedAt = DateTime.UtcNow.AddMinutes(-1),
            }
        );

        await context.SaveChangesAsync();
    }

    // ─────────────────────────────────────────────
    //  FUNC: UpdateItemStatusAsync (5 testcases)
    // ─────────────────────────────────────────────

    [Fact]
    [Trait("CodeModule", "Kitchen")]
    [Trait("Method", "UpdateItemStatusAsync")]
    [Trait("UTCID", "UTCID01")]
    [Trait("Type", "N")]
    public async Task UTCID01_UpdateItemStatusAsync_ExistingItem_UppercasesStatus_ReturnsTrue()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        await SeedOrderWithItemsAsync(
            context,
            orderId: 1,
            orderStatus: "SENT_TO_KITCHEN",
            itemA: (orderItemId: 11, status: "PENDING"),
            itemB: (orderItemId: 12, status: "PENDING")
        );

        var mapper = new Mock<IMapper>();
        var service = new KitchenService(context, mapper.Object);

        var ok = await service.UpdateItemStatusAsync(orderItemId: 11, status: "served");

        Assert.True(ok);
        var item = await context.OrderItems.FindAsync((long)11);
        Assert.Equal("SERVED", item!.Status);
    }

    [Fact]
    [Trait("CodeModule", "Kitchen")]
    [Trait("Method", "UpdateItemStatusAsync")]
    [Trait("UTCID", "UTCID02")]
    [Trait("Type", "A")]
    public async Task UTCID02_UpdateItemStatusAsync_ItemNotFound_ReturnsFalse()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        var mapper = new Mock<IMapper>();
        var service = new KitchenService(context, mapper.Object);

        var ok = await service.UpdateItemStatusAsync(orderItemId: 999, status: "SERVED");

        Assert.False(ok);
    }

    [Fact]
    [Trait("CodeModule", "Kitchen")]
    [Trait("Method", "UpdateItemStatusAsync")]
    [Trait("UTCID", "UTCID03")]
    [Trait("Type", "N")]
    public async Task UTCID03_UpdateItemStatusAsync_LastUnservedItemBecomesServed_OrderStatusBecomesServed()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        await SeedOrderWithItemsAsync(
            context,
            orderId: 1,
            orderStatus: "SENT_TO_KITCHEN",
            itemA: (orderItemId: 11, status: "SERVED"),
            itemB: (orderItemId: 12, status: "PENDING")
        );

        var mapper = new Mock<IMapper>();
        var service = new KitchenService(context, mapper.Object);

        var ok = await service.UpdateItemStatusAsync(orderItemId: 12, status: "SERVED");

        Assert.True(ok);
        var order = await context.Orders.FindAsync((long)1);
        Assert.Equal("SERVED", order!.Status);
    }

    [Fact]
    [Trait("CodeModule", "Kitchen")]
    [Trait("Method", "UpdateItemStatusAsync")]
    [Trait("UTCID", "UTCID04")]
    [Trait("Type", "B")]
    public async Task UTCID04_UpdateItemStatusAsync_NotAllItemsServed_OrderStatusNotChanged()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        await SeedOrderWithItemsAsync(
            context,
            orderId: 1,
            orderStatus: "SENT_TO_KITCHEN",
            itemA: (orderItemId: 11, status: "PENDING"),
            itemB: (orderItemId: 12, status: "PENDING")
        );

        var mapper = new Mock<IMapper>();
        var service = new KitchenService(context, mapper.Object);

        var ok = await service.UpdateItemStatusAsync(orderItemId: 11, status: "COOKING");

        Assert.True(ok);
        var order = await context.Orders.FindAsync((long)1);
        Assert.Equal("SENT_TO_KITCHEN", order!.Status);
    }

    [Fact]
    [Trait("CodeModule", "Kitchen")]
    [Trait("Method", "UpdateItemStatusAsync")]
    [Trait("UTCID", "UTCID05")]
    [Trait("Type", "B")]
    public async Task UTCID05_UpdateItemStatusAsync_AllItemsServedButOrderClosed_DoesNotChangeOrder()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        await SeedOrderWithItemsAsync(
            context,
            orderId: 1,
            orderStatus: "CLOSED",
            itemA: (orderItemId: 11, status: "SERVED"),
            itemB: (orderItemId: 12, status: "PENDING")
        );

        var mapper = new Mock<IMapper>();
        var service = new KitchenService(context, mapper.Object);

        var ok = await service.UpdateItemStatusAsync(orderItemId: 12, status: "SERVED");

        Assert.True(ok);
        var order = await context.Orders.FindAsync((long)1);
        Assert.Equal("CLOSED", order!.Status);
    }
}
