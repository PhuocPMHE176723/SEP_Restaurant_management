using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Moq;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Services.Implementation;
using Xunit;

namespace rmn_be.Tests;

public class ReservationServicePostTests
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

    private static Mock<IMapper> CreateMapperMock()
    {
        var mapperMock = new Mock<IMapper>();
        mapperMock
            .Setup(m => m.Map<ReservationDTO>(It.IsAny<Reservation>()))
            .Returns(
                (Reservation r) =>
                    new ReservationDTO
                    {
                        ReservationId = r.ReservationId,
                        CustomerId = r.CustomerId,
                        TableId = r.TableId,
                        CustomerName = r.CustomerName,
                        CustomerPhone = r.CustomerPhone,
                        ContactEmail = r.ContactEmail,
                        PartySize = r.PartySize,
                        ReservedAt = r.ReservedAt,
                        DurationMinutes = r.DurationMinutes,
                        Status = r.Status,
                        Note = r.Note,
                        CreatedAt = r.CreatedAt,
                        CreatedByStaffId = r.CreatedByStaffId,
                        DepositAmount = r.DepositAmount,
                        IsDepositPaid = r.IsDepositPaid,
                        DepositPaidAt = r.DepositPaidAt,
                    }
            );

        return mapperMock;
    }

    private static async Task SeedCustomerAsync(
        SepDatabaseContext context,
        long customerId,
        string? fullName = "Customer A",
        string? phone = "0900000000",
        string? email = "a@example.com"
    )
    {
        context.Customers.Add(
            new Customer
            {
                CustomerId = customerId,
                FullName = fullName,
                Phone = phone,
                Email = email,
                CreatedAt = DateTime.UtcNow,
            }
        );
        await context.SaveChangesAsync();
    }

    private static async Task<(
        Reservation reservation,
        Order? order
    )> SeedReservationWithOptionalOrderAsync(
        SepDatabaseContext context,
        long reservationId,
        long customerId,
        string status,
        int? tableId = null,
        bool withOrder = false,
        bool withOrderItems = false
    )
    {
        var reservation = new Reservation
        {
            ReservationId = reservationId,
            CustomerId = customerId,
            CustomerName = "Customer",
            CustomerPhone = "090",
            PartySize = 2,
            ReservedAt = DateTime.UtcNow.AddDays(1),
            DurationMinutes = 90,
            Status = status,
            CreatedAt = DateTime.UtcNow,
            TableId = tableId,
            DepositAmount = 200000,
        };
        context.Reservations.Add(reservation);

        Order? order = null;
        if (withOrder)
        {
            order = new Order
            {
                OrderCode = $"OD-{reservationId}",
                ReservationId = reservationId,
                CustomerId = customerId,
                OrderType = "DINE_IN",
                Status = "RESERVED",
                OpenedAt = DateTime.UtcNow,
            };
            context.Orders.Add(order);

            if (withOrderItems)
            {
                order.OrderItems.Add(
                    new OrderItem
                    {
                        ItemId = 1,
                        ItemNameSnapshot = "Item",
                        Quantity = 1,
                        UnitPrice = 10000,
                        DiscountAmount = 0,
                        Status = "PENDING",
                        CreatedAt = DateTime.UtcNow,
                    }
                );
            }
        }

        await context.SaveChangesAsync();
        return (reservation, order);
    }

    // ─────────────────────────────────────────────
    //  FUNC: CreateReservationAsync (5 testcases)
    // ─────────────────────────────────────────────

    [Fact]
    [Trait("CodeModule", "Reservation")]
    [Trait("Method", "CreateReservationAsync")]
    [Trait("UTCID", "UTCID01")]
    [Trait("Type", "N")]
    public async Task UTCID01_CreateReservationAsync_CustomerExists_NoMenuItems_DepositIsMin()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        await SeedCustomerAsync(context, customerId: 1, fullName: "Alice", phone: "091");

        var mapperMock = CreateMapperMock();
        var service = new ReservationService(context, mapperMock.Object);

        var dto = await service.CreateReservationAsync(
            1,
            new CreateReservationRequest
            {
                ReservedAt = DateTime.UtcNow.AddDays(1),
                PartySize = 2,
                DurationMinutes = 90,
                Note = "note",
                MenuItems = new List<OrderItemRequest>(),
            }
        );

        Assert.NotNull(dto);
        Assert.Equal("PENDING", dto.Status);
        Assert.Equal(200000, dto.DepositAmount);
        Assert.Equal(1, await context.Reservations.CountAsync());
    }

    [Fact]
    [Trait("CodeModule", "Reservation")]
    [Trait("Method", "CreateReservationAsync")]
    [Trait("UTCID", "UTCID02")]
    [Trait("Type", "A")]
    public async Task UTCID02_CreateReservationAsync_CustomerNotFound_ThrowsWrappedException()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        var mapperMock = CreateMapperMock();
        var service = new ReservationService(context, mapperMock.Object);

        var ex = await Assert.ThrowsAsync<Exception>(() =>
            service.CreateReservationAsync(
                999,
                new CreateReservationRequest
                {
                    ReservedAt = DateTime.UtcNow.AddDays(1),
                    PartySize = 2,
                }
            )
        );

        Assert.Contains("Failed to create reservation", ex.Message);
        Assert.Contains("Customer not found", ex.Message);
        Assert.Equal(0, await context.Reservations.CountAsync());
    }

    [Fact]
    [Trait("CodeModule", "Reservation")]
    [Trait("Method", "CreateReservationAsync")]
    [Trait("UTCID", "UTCID03")]
    [Trait("Type", "N")]
    public async Task UTCID03_CreateReservationAsync_WithMenuItems_DepositIsHalfTotal_WhenGreaterThanMin()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        await SeedCustomerAsync(context, customerId: 1);

        context.MenuItems.Add(
            new MenuItem
            {
                ItemId = 10,
                CategoryId = 1,
                ItemName = "Steak",
                BasePrice = 1000000,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
            }
        );
        await context.SaveChangesAsync();

        var mapperMock = CreateMapperMock();
        var service = new ReservationService(context, mapperMock.Object);

        var dto = await service.CreateReservationAsync(
            1,
            new CreateReservationRequest
            {
                ReservedAt = DateTime.UtcNow.AddDays(1),
                PartySize = 2,
                MenuItems = new List<OrderItemRequest>
                {
                    new() { ItemId = 10, Quantity = 1 },
                },
            }
        );

        Assert.Equal(500000, dto.DepositAmount);
        Assert.Equal(1, await context.Orders.CountAsync());
        Assert.Equal(1, await context.OrderItems.CountAsync());
    }

    [Fact]
    [Trait("CodeModule", "Reservation")]
    [Trait("Method", "CreateReservationAsync")]
    [Trait("UTCID", "UTCID04")]
    [Trait("Type", "B")]
    public async Task UTCID04_CreateReservationAsync_MenuItemNotFound_OrderStillCreated_DepositFallsBackToMin()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);
        await SeedCustomerAsync(context, customerId: 1);

        var mapperMock = CreateMapperMock();
        var service = new ReservationService(context, mapperMock.Object);

        var dto = await service.CreateReservationAsync(
            1,
            new CreateReservationRequest
            {
                ReservedAt = DateTime.UtcNow.AddDays(1),
                PartySize = 2,
                MenuItems = new List<OrderItemRequest>
                {
                    new() { ItemId = 999, Quantity = 1 },
                },
            }
        );

        Assert.Equal(200000, dto.DepositAmount);
        Assert.Equal(1, await context.Orders.CountAsync());
        Assert.Equal(0, await context.OrderItems.CountAsync());
    }

    [Fact]
    [Trait("CodeModule", "Reservation")]
    [Trait("Method", "CreateReservationAsync")]
    [Trait("UTCID", "UTCID05")]
    [Trait("Type", "B")]
    public async Task UTCID05_CreateReservationAsync_CustomerNoNameNoPhone_FallsBackToGuestAndNA()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        // Customer exists but has no FullName/Phone and no linked User
        await SeedCustomerAsync(context, customerId: 1, fullName: null, phone: null);

        var mapperMock = CreateMapperMock();
        var service = new ReservationService(context, mapperMock.Object);

        var dto = await service.CreateReservationAsync(
            1,
            new CreateReservationRequest { ReservedAt = DateTime.UtcNow.AddDays(1), PartySize = 2 }
        );

        Assert.Equal("Guest", dto.CustomerName);
        Assert.Equal("N/A", dto.CustomerPhone);
    }

    // ─────────────────────────────────────────────
    //  FUNC: CancelReservationAsync (5 testcases)
    // ─────────────────────────────────────────────

    [Fact]
    [Trait("CodeModule", "Reservation")]
    [Trait("Method", "CancelReservationAsync")]
    [Trait("UTCID", "UTCID01")]
    [Trait("Type", "N")]
    public async Task UTCID01_CancelReservationAsync_ExistingWithOrderAndItems_CancelsAll()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        await SeedCustomerAsync(context, customerId: 1);
        await SeedReservationWithOptionalOrderAsync(
            context,
            reservationId: 1,
            customerId: 1,
            status: "PENDING",
            withOrder: true,
            withOrderItems: true
        );

        var mapperMock = CreateMapperMock();
        var service = new ReservationService(context, mapperMock.Object);

        var ok = await service.CancelReservationAsync(reservationId: 1, customerId: 1);

        Assert.True(ok);
        var reservation = await context.Reservations.FindAsync((long)1);
        Assert.Equal("CANCELLED", reservation!.Status);

        var order = await context.Orders.Include(o => o.OrderItems).SingleAsync();
        Assert.Equal("CANCELLED", order.Status);
        Assert.NotNull(order.ClosedAt);
        Assert.All(order.OrderItems, oi => Assert.Equal("CANCELLED", oi.Status));
    }

    [Fact]
    [Trait("CodeModule", "Reservation")]
    [Trait("Method", "CancelReservationAsync")]
    [Trait("UTCID", "UTCID02")]
    [Trait("Type", "A")]
    public async Task UTCID02_CancelReservationAsync_NotFound_ReturnsFalse()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        var mapperMock = CreateMapperMock();
        var service = new ReservationService(context, mapperMock.Object);

        var ok = await service.CancelReservationAsync(reservationId: 999, customerId: 1);

        Assert.False(ok);
    }

    [Fact]
    [Trait("CodeModule", "Reservation")]
    [Trait("Method", "CancelReservationAsync")]
    [Trait("UTCID", "UTCID03")]
    [Trait("Type", "A")]
    public async Task UTCID03_CancelReservationAsync_AlreadyCancelled_ReturnsFalse()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        await SeedCustomerAsync(context, customerId: 1);
        await SeedReservationWithOptionalOrderAsync(
            context,
            reservationId: 1,
            customerId: 1,
            status: "CANCELLED",
            withOrder: false
        );

        var mapperMock = CreateMapperMock();
        var service = new ReservationService(context, mapperMock.Object);

        var ok = await service.CancelReservationAsync(reservationId: 1, customerId: 1);

        Assert.False(ok);
    }

    [Fact]
    [Trait("CodeModule", "Reservation")]
    [Trait("Method", "CancelReservationAsync")]
    [Trait("UTCID", "UTCID04")]
    [Trait("Type", "B")]
    public async Task UTCID04_CancelReservationAsync_ExistingWithoutOrder_CancelsReservationOnly()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        await SeedCustomerAsync(context, customerId: 1);
        await SeedReservationWithOptionalOrderAsync(
            context,
            reservationId: 1,
            customerId: 1,
            status: "PENDING",
            withOrder: false
        );

        var mapperMock = CreateMapperMock();
        var service = new ReservationService(context, mapperMock.Object);

        var ok = await service.CancelReservationAsync(reservationId: 1, customerId: 1);

        Assert.True(ok);
        var reservation = await context.Reservations.FindAsync((long)1);
        Assert.Equal("CANCELLED", reservation!.Status);
        Assert.Equal(0, await context.Orders.CountAsync());
    }

    [Fact]
    [Trait("CodeModule", "Reservation")]
    [Trait("Method", "CancelReservationAsync")]
    [Trait("UTCID", "UTCID05")]
    [Trait("Type", "B")]
    public async Task UTCID05_CancelReservationAsync_OrderWithoutItems_CancelsOrderAndSetsClosedAt()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        await SeedCustomerAsync(context, customerId: 1);
        await SeedReservationWithOptionalOrderAsync(
            context,
            reservationId: 1,
            customerId: 1,
            status: "PENDING",
            withOrder: true,
            withOrderItems: false
        );

        var mapperMock = CreateMapperMock();
        var service = new ReservationService(context, mapperMock.Object);

        var ok = await service.CancelReservationAsync(reservationId: 1, customerId: 1);

        Assert.True(ok);
        var order = await context.Orders.SingleAsync();
        Assert.Equal("CANCELLED", order.Status);
        Assert.NotNull(order.ClosedAt);
    }

    // ─────────────────────────────────────────────
    //  FUNC: CancelUnpaidReservationAsync (5 testcases)
    // ─────────────────────────────────────────────

    [Fact]
    [Trait("CodeModule", "Reservation")]
    [Trait("Method", "CancelUnpaidReservationAsync")]
    [Trait("UTCID", "UTCID01")]
    [Trait("Type", "N")]
    public async Task UTCID01_CancelUnpaidReservationAsync_Pending_CancelsAndAppendsNote()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        await SeedCustomerAsync(context, customerId: 1);
        await SeedReservationWithOptionalOrderAsync(
            context,
            reservationId: 1,
            customerId: 1,
            status: "PENDING"
        );

        var mapperMock = CreateMapperMock();
        var service = new ReservationService(context, mapperMock.Object);

        var ok = await service.CancelUnpaidReservationAsync(reservationId: 1);

        Assert.True(ok);
        var reservation = await context.Reservations.FindAsync((long)1);
        Assert.Equal("CANCELLED", reservation!.Status);
        Assert.Contains("Hủy tự động", reservation.Note);
    }

    [Fact]
    [Trait("CodeModule", "Reservation")]
    [Trait("Method", "CancelUnpaidReservationAsync")]
    [Trait("UTCID", "UTCID02")]
    [Trait("Type", "A")]
    public async Task UTCID02_CancelUnpaidReservationAsync_NotFound_ReturnsFalse()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        var mapperMock = CreateMapperMock();
        var service = new ReservationService(context, mapperMock.Object);

        var ok = await service.CancelUnpaidReservationAsync(reservationId: 999);

        Assert.False(ok);
    }

    [Fact]
    [Trait("CodeModule", "Reservation")]
    [Trait("Method", "CancelUnpaidReservationAsync")]
    [Trait("UTCID", "UTCID03")]
    [Trait("Type", "A")]
    public async Task UTCID03_CancelUnpaidReservationAsync_StatusNotPending_ReturnsFalse()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        await SeedCustomerAsync(context, customerId: 1);
        await SeedReservationWithOptionalOrderAsync(
            context,
            reservationId: 1,
            customerId: 1,
            status: "CONFIRMED"
        );

        var mapperMock = CreateMapperMock();
        var service = new ReservationService(context, mapperMock.Object);

        var ok = await service.CancelUnpaidReservationAsync(reservationId: 1);

        Assert.False(ok);
        var reservation = await context.Reservations.FindAsync((long)1);
        Assert.Equal("CONFIRMED", reservation!.Status);
    }

    [Fact]
    [Trait("CodeModule", "Reservation")]
    [Trait("Method", "CancelUnpaidReservationAsync")]
    [Trait("UTCID", "UTCID04")]
    [Trait("Type", "B")]
    public async Task UTCID04_CancelUnpaidReservationAsync_WithOrderAndItems_CancelsOrderAndItems()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        await SeedCustomerAsync(context, customerId: 1);
        await SeedReservationWithOptionalOrderAsync(
            context,
            reservationId: 1,
            customerId: 1,
            status: "PENDING",
            withOrder: true,
            withOrderItems: true
        );

        var mapperMock = CreateMapperMock();
        var service = new ReservationService(context, mapperMock.Object);

        var ok = await service.CancelUnpaidReservationAsync(reservationId: 1);

        Assert.True(ok);
        var order = await context.Orders.Include(o => o.OrderItems).SingleAsync();
        Assert.Equal("CANCELLED", order.Status);
        Assert.All(order.OrderItems, oi => Assert.Equal("CANCELLED", oi.Status));
    }

    [Fact]
    [Trait("CodeModule", "Reservation")]
    [Trait("Method", "CancelUnpaidReservationAsync")]
    [Trait("UTCID", "UTCID05")]
    [Trait("Type", "B")]
    public async Task UTCID05_CancelUnpaidReservationAsync_NoteExisting_AppendsOnce()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        await SeedCustomerAsync(context, customerId: 1);
        context.Reservations.Add(
            new Reservation
            {
                ReservationId = 1,
                CustomerId = 1,
                CustomerName = "Customer",
                CustomerPhone = "090",
                PartySize = 2,
                ReservedAt = DateTime.UtcNow.AddDays(1),
                DurationMinutes = 90,
                Status = "PENDING",
                CreatedAt = DateTime.UtcNow,
                Note = "abc",
            }
        );
        await context.SaveChangesAsync();

        var mapperMock = CreateMapperMock();
        var service = new ReservationService(context, mapperMock.Object);

        var ok = await service.CancelUnpaidReservationAsync(reservationId: 1);

        Assert.True(ok);
        var reservation = await context.Reservations.FindAsync((long)1);
        Assert.Contains("abc", reservation!.Note);
        Assert.Contains("Hủy tự động", reservation.Note);
    }

    // ─────────────────────────────────────────────
    //  FUNC: UpdateReservationStatusAsync (5 testcases)
    // ─────────────────────────────────────────────

    [Fact]
    [Trait("CodeModule", "Reservation")]
    [Trait("Method", "UpdateReservationStatusAsync")]
    [Trait("UTCID", "UTCID01")]
    [Trait("Type", "N")]
    public async Task UTCID01_UpdateReservationStatusAsync_CheckedInWithTable_SetsTableOccupiedAndOrderOpen()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        await SeedCustomerAsync(context, customerId: 1);
        context.DiningTables.Add(
            new DiningTable
            {
                TableId = 1,
                TableCode = "T1",
                Capacity = 4,
                Status = "AVAILABLE",
            }
        );
        await context.SaveChangesAsync();

        await SeedReservationWithOptionalOrderAsync(
            context,
            reservationId: 1,
            customerId: 1,
            status: "CONFIRMED",
            tableId: null,
            withOrder: true,
            withOrderItems: true
        );

        var mapperMock = CreateMapperMock();
        var service = new ReservationService(context, mapperMock.Object);

        var ok = await service.UpdateReservationStatusAsync(
            id: 1,
            status: "CHECKED_IN",
            tableId: 1
        );

        Assert.True(ok);
        var reservation = await context.Reservations.FindAsync((long)1);
        Assert.Equal("CHECKED_IN", reservation!.Status);
        Assert.Equal(1, reservation.TableId);

        var table = await context.DiningTables.FindAsync(1);
        Assert.Equal("OCCUPIED", table!.Status);

        var order = await context.Orders.SingleAsync();
        Assert.Equal("OPEN", order.Status);
        Assert.Equal(1, order.TableId);
    }

    [Fact]
    [Trait("CodeModule", "Reservation")]
    [Trait("Method", "UpdateReservationStatusAsync")]
    [Trait("UTCID", "UTCID02")]
    [Trait("Type", "A")]
    public async Task UTCID02_UpdateReservationStatusAsync_InvalidStatus_ReturnsFalse()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        var mapperMock = CreateMapperMock();
        var service = new ReservationService(context, mapperMock.Object);

        var ok = await service.UpdateReservationStatusAsync(id: 1, status: "XYZ");

        Assert.False(ok);
    }

    [Fact]
    [Trait("CodeModule", "Reservation")]
    [Trait("Method", "UpdateReservationStatusAsync")]
    [Trait("UTCID", "UTCID03")]
    [Trait("Type", "A")]
    public async Task UTCID03_UpdateReservationStatusAsync_ReservationNotFound_ReturnsFalse()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        context.DiningTables.Add(
            new DiningTable
            {
                TableId = 1,
                TableCode = "T1",
                Capacity = 4,
                Status = "AVAILABLE",
            }
        );
        await context.SaveChangesAsync();

        var mapperMock = CreateMapperMock();
        var service = new ReservationService(context, mapperMock.Object);

        var ok = await service.UpdateReservationStatusAsync(
            id: 999,
            status: "CONFIRMED",
            tableId: 1
        );

        Assert.False(ok);
    }

    [Fact]
    [Trait("CodeModule", "Reservation")]
    [Trait("Method", "UpdateReservationStatusAsync")]
    [Trait("UTCID", "UTCID04")]
    [Trait("Type", "A")]
    public async Task UTCID04_UpdateReservationStatusAsync_TableNotFound_ReturnsFalse()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        await SeedCustomerAsync(context, customerId: 1);
        await SeedReservationWithOptionalOrderAsync(
            context,
            reservationId: 1,
            customerId: 1,
            status: "CONFIRMED"
        );

        var mapperMock = CreateMapperMock();
        var service = new ReservationService(context, mapperMock.Object);

        var ok = await service.UpdateReservationStatusAsync(
            id: 1,
            status: "CONFIRMED",
            tableId: 999
        );

        Assert.False(ok);
    }

    [Fact]
    [Trait("CodeModule", "Reservation")]
    [Trait("Method", "UpdateReservationStatusAsync")]
    [Trait("UTCID", "UTCID05")]
    [Trait("Type", "B")]
    public async Task UTCID05_UpdateReservationStatusAsync_Cancelled_ReleasesTableAndCancelsOrderAndItems()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        await SeedCustomerAsync(context, customerId: 1);
        context.DiningTables.Add(
            new DiningTable
            {
                TableId = 1,
                TableCode = "T1",
                Capacity = 4,
                Status = "RESERVED",
            }
        );
        await context.SaveChangesAsync();

        await SeedReservationWithOptionalOrderAsync(
            context,
            reservationId: 1,
            customerId: 1,
            status: "CONFIRMED",
            tableId: 1,
            withOrder: true,
            withOrderItems: true
        );

        var mapperMock = CreateMapperMock();
        var service = new ReservationService(context, mapperMock.Object);

        var ok = await service.UpdateReservationStatusAsync(
            id: 1,
            status: "CANCELLED",
            tableId: null
        );

        Assert.True(ok);
        var table = await context.DiningTables.FindAsync(1);
        Assert.Equal("AVAILABLE", table!.Status);

        var order = await context.Orders.Include(o => o.OrderItems).SingleAsync();
        Assert.Equal("CANCELLED", order.Status);
        Assert.NotNull(order.ClosedAt);
        Assert.All(order.OrderItems, oi => Assert.Equal("CANCELLED", oi.Status));
    }

    // ─────────────────────────────────────────────
    //  FUNC: UpdateReservationItemsAsync (5 testcases)
    // ─────────────────────────────────────────────

    [Fact]
    [Trait("CodeModule", "Reservation")]
    [Trait("Method", "UpdateReservationItemsAsync")]
    [Trait("UTCID", "UTCID01")]
    [Trait("Type", "N")]
    public async Task UTCID01_UpdateReservationItemsAsync_PendingNoOrder_NewItems_CreateOrderAndSetDeposit()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        await SeedCustomerAsync(context, customerId: 1);
        context.Reservations.Add(
            new Reservation
            {
                ReservationId = 1,
                CustomerId = 1,
                CustomerName = "Customer",
                CustomerPhone = "090",
                PartySize = 2,
                ReservedAt = DateTime.UtcNow.AddDays(1),
                DurationMinutes = 90,
                Status = "PENDING",
                CreatedAt = DateTime.UtcNow,
                DepositAmount = 200000,
            }
        );
        context.MenuItems.Add(
            new MenuItem
            {
                ItemId = 10,
                CategoryId = 1,
                ItemName = "Tea",
                BasePrice = 100000,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
            }
        );
        await context.SaveChangesAsync();

        var mapperMock = CreateMapperMock();
        var service = new ReservationService(context, mapperMock.Object);

        var ok = await service.UpdateReservationItemsAsync(
            reservationId: 1,
            customerId: 1,
            newItems: new List<OrderItemRequest>
            {
                new() { ItemId = 10, Quantity = 2 },
            }
        );

        Assert.True(ok);
        Assert.Equal(1, await context.Orders.CountAsync());
        Assert.Equal(1, await context.OrderItems.CountAsync());

        var reservation = await context
            .Reservations.Include(r => r.Order)
            .SingleAsync(r => r.ReservationId == 1);
        Assert.NotNull(reservation.Order);
        Assert.Equal(100000 * 2 * 0.5m, reservation.DepositAmount);
        Assert.Contains("Đã cập nhật món", reservation.Note);
    }

    [Fact]
    [Trait("CodeModule", "Reservation")]
    [Trait("Method", "UpdateReservationItemsAsync")]
    [Trait("UTCID", "UTCID02")]
    [Trait("Type", "A")]
    public async Task UTCID02_UpdateReservationItemsAsync_ReservationNotFound_ReturnsFalse()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        var mapperMock = CreateMapperMock();
        var service = new ReservationService(context, mapperMock.Object);

        var ok = await service.UpdateReservationItemsAsync(
            reservationId: 999,
            customerId: 1,
            newItems: new List<OrderItemRequest>
            {
                new() { ItemId = 10, Quantity = 1 },
            }
        );

        Assert.False(ok);
    }

    [Fact]
    [Trait("CodeModule", "Reservation")]
    [Trait("Method", "UpdateReservationItemsAsync")]
    [Trait("UTCID", "UTCID03")]
    [Trait("Type", "A")]
    public async Task UTCID03_UpdateReservationItemsAsync_StatusNotPending_ReturnsFalse()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        await SeedCustomerAsync(context, customerId: 1);
        await SeedReservationWithOptionalOrderAsync(
            context,
            reservationId: 1,
            customerId: 1,
            status: "CONFIRMED"
        );

        var mapperMock = CreateMapperMock();
        var service = new ReservationService(context, mapperMock.Object);

        var ok = await service.UpdateReservationItemsAsync(
            reservationId: 1,
            customerId: 1,
            newItems: new List<OrderItemRequest>
            {
                new() { ItemId = 10, Quantity = 1 },
            }
        );

        Assert.False(ok);
    }

    [Fact]
    [Trait("CodeModule", "Reservation")]
    [Trait("Method", "UpdateReservationItemsAsync")]
    [Trait("UTCID", "UTCID04")]
    [Trait("Type", "B")]
    public async Task UTCID04_UpdateReservationItemsAsync_NoOrderAndEmptyItems_ReturnsTrue_NoChanges()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        await SeedCustomerAsync(context, customerId: 1);
        context.Reservations.Add(
            new Reservation
            {
                ReservationId = 1,
                CustomerId = 1,
                CustomerName = "Customer",
                CustomerPhone = "090",
                PartySize = 2,
                ReservedAt = DateTime.UtcNow.AddDays(1),
                DurationMinutes = 90,
                Status = "PENDING",
                CreatedAt = DateTime.UtcNow,
                DepositAmount = 200000,
            }
        );
        await context.SaveChangesAsync();

        var mapperMock = CreateMapperMock();
        var service = new ReservationService(context, mapperMock.Object);

        var ok = await service.UpdateReservationItemsAsync(
            reservationId: 1,
            customerId: 1,
            newItems: new List<OrderItemRequest>()
        );

        Assert.True(ok);
        Assert.Equal(0, await context.Orders.CountAsync());
        var reservation = await context.Reservations.FindAsync((long)1);
        Assert.Null(reservation!.Order);
        Assert.Equal(200000, reservation.DepositAmount);
    }

    [Fact]
    [Trait("CodeModule", "Reservation")]
    [Trait("Method", "UpdateReservationItemsAsync")]
    [Trait("UTCID", "UTCID05")]
    [Trait("Type", "B")]
    public async Task UTCID05_UpdateReservationItemsAsync_ExistingOrder_RemoveAllItems_DeletesOrderAndZeroDeposit()
    {
        var dbName = Guid.NewGuid().ToString();
        await using var context = CreateContext(dbName);

        await SeedCustomerAsync(context, customerId: 1);

        // Seed reservation + order + one item
        var reservation = new Reservation
        {
            ReservationId = 1,
            CustomerId = 1,
            CustomerName = "Customer",
            CustomerPhone = "090",
            PartySize = 2,
            ReservedAt = DateTime.UtcNow.AddDays(1),
            DurationMinutes = 90,
            Status = "PENDING",
            CreatedAt = DateTime.UtcNow,
            DepositAmount = 200000,
        };
        var order = new Order
        {
            OrderCode = "OD-1",
            ReservationId = 1,
            CustomerId = 1,
            Status = "PENDING",
            OpenedAt = DateTime.UtcNow,
        };
        order.OrderItems.Add(
            new OrderItem
            {
                ItemId = 1,
                ItemNameSnapshot = "Item",
                Quantity = 1,
                UnitPrice = 100000,
                DiscountAmount = 0,
                Status = "PENDING",
                CreatedAt = DateTime.UtcNow,
            }
        );
        reservation.Order = order;
        context.Reservations.Add(reservation);
        context.Orders.Add(order);
        await context.SaveChangesAsync();

        var mapperMock = CreateMapperMock();
        var service = new ReservationService(context, mapperMock.Object);

        var ok = await service.UpdateReservationItemsAsync(
            reservationId: 1,
            customerId: 1,
            newItems: new List<OrderItemRequest>()
        );

        Assert.True(ok);
        Assert.Equal(0, await context.Orders.CountAsync());
        Assert.Equal(0, await context.OrderItems.CountAsync());

        var storedReservation = await context
            .Reservations.Include(r => r.Order)
            .SingleAsync(r => r.ReservationId == 1);
        Assert.Null(storedReservation.Order);
        Assert.Equal(0, storedReservation.DepositAmount);
    }
}
