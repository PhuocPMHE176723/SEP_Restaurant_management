using System;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Moq;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Services.Implementation;
using Xunit;

namespace rmn_be.Tests;

public class InvoiceServicePostTests
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

    private static async Task SeedStaffAsync(SepDatabaseContext context, long staffId)
    {
        var userId = $"u-{staffId}";
        context.Users.Add(new UserIdentity { Id = userId, UserName = userId });
        context.Staffs.Add(
            new Staff
            {
                StaffId = staffId,
                UserId = userId,
                StaffCode = $"S{staffId}",
                FullName = "Staff",
                WorkingStatus = "ACTIVE",
                CreatedAt = DateTime.UtcNow,
            }
        );
        await context.SaveChangesAsync();
    }

    private static async Task SeedOrderAsync(
        SepDatabaseContext context,
        long orderId,
        long? customerId,
        int? tableId,
        long? reservationId,
        decimal unitPrice,
        int quantity,
        bool depositPaid,
        decimal depositAmount
    )
    {
        if (tableId.HasValue)
        {
            context.DiningTables.Add(
                new DiningTable
                {
                    TableId = tableId.Value,
                    TableCode = $"T{tableId}",
                    Capacity = 4,
                    Status = "OCCUPIED",
                }
            );
        }

        if (customerId.HasValue)
        {
            context.Customers.Add(
                new Customer
                {
                    CustomerId = customerId.Value,
                    FullName = "Customer",
                    Phone = "090",
                    Email = "c@example.com",
                    TotalPoints = 10,
                    CreatedAt = DateTime.UtcNow,
                }
            );
        }

        Reservation? reservation = null;
        if (reservationId.HasValue)
        {
            reservation = new Reservation
            {
                ReservationId = reservationId.Value,
                CustomerId = customerId,
                CustomerName = "Customer",
                CustomerPhone = "090",
                PartySize = 2,
                ReservedAt = DateTime.UtcNow.AddHours(-1),
                DurationMinutes = 90,
                Status = "CHECKED_IN",
                CreatedAt = DateTime.UtcNow.AddHours(-2),
                IsDepositPaid = depositPaid,
                DepositAmount = depositAmount,
            };
            if (tableId.HasValue)
            {
                reservation.ReservationTables.Add(
                    new ReservationTable { TableId = tableId.Value, AssignedAt = DateTime.UtcNow }
                );
            }
            context.Reservations.Add(reservation);
        }

        var menu = new MenuItem
        {
            ItemId = 1,
            CategoryId = 1,
            ItemName = "Item",
            BasePrice = unitPrice,
            IsActive = true,
            CreatedAt = DateTime.UtcNow,
        };
        context.MenuItems.Add(menu);

        var order = new Order
        {
            OrderId = orderId,
            OrderCode = $"OD-{orderId}",
            TableId = tableId,
            ReservationId = reservationId,
            CustomerId = customerId,
            OrderType = "DINE_IN",
            Status = "OPEN",
            OpenedAt = DateTime.UtcNow,
        };
        context.Orders.Add(order);

        context.OrderItems.Add(
            new OrderItem
            {
                OrderId = orderId,
                ItemId = 1,
                MenuItem = menu,
                ItemNameSnapshot = "Item",
                UnitPrice = unitPrice,
                Quantity = quantity,
                DiscountAmount = 0,
                Status = "SERVED",
                CreatedAt = DateTime.UtcNow,
            }
        );

        await context.SaveChangesAsync();
    }

    // ─────────────────────────────────────────────
    //  FUNC: ProcessCheckoutAsync (5 testcases)
    // ─────────────────────────────────────────────

    [Fact]
    [Trait("CodeModule", "Invoice")]
    [Trait("Method", "ProcessCheckoutAsync")]
    [Trait("UTCID", "UTCID01")]
    [Trait("Type", "N")]
    public async Task UTCID01_ProcessCheckoutAsync_PaidEnough_ClosesOrder_ReleasesTable_CompletesReservation()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        await SeedStaffAsync(context, staffId: 7);
        await SeedOrderAsync(
            context,
            orderId: 1,
            customerId: 1,
            tableId: 1,
            reservationId: 1,
            unitPrice: 100000,
            quantity: 1,
            depositPaid: false,
            depositAmount: 0
        );

        var mapper = new Mock<IMapper>();
        var service = new InvoiceService(context, mapper.Object);

        var invoice = await service.ProcessCheckoutAsync(
            orderId: 1,
            staffId: 7,
            discountCode: null,
            pointsToUse: 0,
            paidAmount: 200000
        );

        Assert.NotNull(invoice);
        Assert.Equal(1, invoice.OrderId);
        Assert.Equal("PAID", invoice.PaymentStatus);

        var order = await context
            .Orders.Include(o => o.Table)
            .Include(o => o.Reservation)
            .SingleAsync(o => o.OrderId == 1);
        Assert.Equal("CLOSED", order.Status);
        Assert.NotNull(order.ClosedAt);
        Assert.Equal("AVAILABLE", order.Table!.Status);
        Assert.Equal("COMPLETED", order.Reservation!.Status);

        Assert.Equal(1, await context.Invoices.CountAsync());
    }

    [Fact]
    [Trait("CodeModule", "Invoice")]
    [Trait("Method", "ProcessCheckoutAsync")]
    [Trait("UTCID", "UTCID02")]
    [Trait("Type", "B")]
    public async Task UTCID02_ProcessCheckoutAsync_PaidNotEnough_SetsPartial()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        await SeedStaffAsync(context, staffId: 7);
        await SeedOrderAsync(
            context,
            orderId: 1,
            customerId: 1,
            tableId: 1,
            reservationId: null,
            unitPrice: 100000,
            quantity: 1,
            depositPaid: false,
            depositAmount: 0
        );

        var mapper = new Mock<IMapper>();
        var service = new InvoiceService(context, mapper.Object);

        var invoice = await service.ProcessCheckoutAsync(
            orderId: 1,
            staffId: 7,
            discountCode: null,
            pointsToUse: 0,
            paidAmount: 1
        );

        Assert.Equal("PARTIAL", invoice.PaymentStatus);
    }

    [Fact]
    [Trait("CodeModule", "Invoice")]
    [Trait("Method", "ProcessCheckoutAsync")]
    [Trait("UTCID", "UTCID03")]
    [Trait("Type", "N")]
    public async Task UTCID03_ProcessCheckoutAsync_UsePoints_MinusPointsAndWritesRedeemLedger()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        await SeedStaffAsync(context, staffId: 7);
        await SeedOrderAsync(
            context,
            orderId: 1,
            customerId: 1,
            tableId: null,
            reservationId: null,
            unitPrice: 100000,
            quantity: 1,
            depositPaid: false,
            depositAmount: 0
        );

        // Customer starts with 10 points
        var customerBefore = await context.Customers.SingleAsync(c => c.CustomerId == 1);
        Assert.Equal(10, customerBefore.TotalPoints);

        var mapper = new Mock<IMapper>();
        var service = new InvoiceService(context, mapper.Object);

        await service.ProcessCheckoutAsync(
            orderId: 1,
            staffId: 7,
            discountCode: null,
            pointsToUse: 99,
            paidAmount: 200000
        );

        var customerAfter = await context.Customers.SingleAsync(c => c.CustomerId == 1);
        // Redeem 10 points, then earn new points based on amountToPay
        Assert.Equal(4, customerAfter.TotalPoints);

        var redeem = await context.CustomerPointsLedgers.SingleAsync(l => l.RefType == "REDEEM");
        Assert.Equal(-10, redeem.PointsChange);

        var earned = await context.CustomerPointsLedgers.SingleAsync(l => l.RefType == "INVOICE");
        Assert.Equal(4, earned.PointsChange);
    }

    [Fact]
    [Trait("CodeModule", "Invoice")]
    [Trait("Method", "ProcessCheckoutAsync")]
    [Trait("UTCID", "UTCID04")]
    [Trait("Type", "B")]
    public async Task UTCID04_ProcessCheckoutAsync_InvalidDiscountCode_DoesNotApplyDiscount()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        await SeedStaffAsync(context, staffId: 7);
        await SeedOrderAsync(
            context,
            orderId: 1,
            customerId: null,
            tableId: null,
            reservationId: null,
            unitPrice: 100000,
            quantity: 1,
            depositPaid: false,
            depositAmount: 0
        );

        context.DiscountCodes.Add(
            new DiscountCode
            {
                DiscountId = 1,
                Code = "OFF",
                DiscountType = "PERCENT",
                DiscountValue = 50,
                MinOrderValue = 200000,
                IsActive = true,
                ValidFrom = DateTime.UtcNow.AddDays(-1),
                ValidTo = DateTime.UtcNow.AddDays(1),
            }
        );
        await context.SaveChangesAsync();

        var mapper = new Mock<IMapper>();
        var service = new InvoiceService(context, mapper.Object);

        var invoice = await service.ProcessCheckoutAsync(
            orderId: 1,
            staffId: 7,
            discountCode: "OFF",
            pointsToUse: 0,
            paidAmount: 200000
        );

        // Subtotal is 100k, below MinOrderValue => no discount
        Assert.Equal(0, invoice.DiscountAmount);
    }

    [Fact]
    [Trait("CodeModule", "Invoice")]
    [Trait("Method", "ProcessCheckoutAsync")]
    [Trait("UTCID", "UTCID05")]
    [Trait("Type", "B")]
    public async Task UTCID05_ProcessCheckoutAsync_DepositPaid_DeductsDeposit_AmountToPayZero_PaidStatusPaid()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        await SeedStaffAsync(context, staffId: 7);
        await SeedOrderAsync(
            context,
            orderId: 1,
            customerId: 1,
            tableId: 1,
            reservationId: 1,
            unitPrice: 100000,
            quantity: 1,
            depositPaid: true,
            depositAmount: 10000000
        );

        var mapper = new Mock<IMapper>();
        var service = new InvoiceService(context, mapper.Object);

        var invoice = await service.ProcessCheckoutAsync(
            orderId: 1,
            staffId: 7,
            discountCode: null,
            pointsToUse: 0,
            paidAmount: 0
        );

        // AmountToPay should be 0 because deposit covers it, so 0 paid => PAID
        Assert.Equal("PAID", invoice.PaymentStatus);
    }
}
