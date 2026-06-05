using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Middlewares;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SEP_Restaurant_management.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Manager")]
public class DashboardController : BaseController
{
    private readonly SepDatabaseContext _db;

    public DashboardController(SepDatabaseContext db)
    {
        _db = db;
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetDashboardStats()
    {
        try
        {
            var serverToday = DateTime.Today;
            var startOfTodayServer = serverToday;
            var startOfTodayVn = DateTimeHelper.VietnamNow().Date;
            var sevenDaysAgoServer = serverToday.AddDays(-6);
            var thirtyDaysAgoServer = serverToday.AddDays(-29);

            // ────────────────────────────────────────────────────────
            // 1. BASIC OPERATIONAL METRICS (COMMON)
            // ────────────────────────────────────────────────────────
            
            // Daily Revenue (Today)
            var dailyRevenue = await _db.Invoices
                .Where(i => i.PaymentStatus == "PAID" && i.IssuedAt >= startOfTodayServer)
                .SumAsync(i => (decimal?)i.TotalAmount) ?? 0;

            // Monthly Revenue (This Calendar Month)
            var startOfMonthServer = new DateTime(serverToday.Year, serverToday.Month, 1);
            var monthlyRevenue = await _db.Invoices
                .Where(i => i.PaymentStatus == "PAID" && i.IssuedAt >= startOfMonthServer)
                .SumAsync(i => (decimal?)i.TotalAmount) ?? 0;

            // Table counts
            var totalTables = await _db.DiningTables.CountAsync(t => t.IsActive == true);
            var occupiedTables = await _db.DiningTables.CountAsync(t => t.IsActive == true && t.Status == "OCCUPIED");

            // Reservation counts
            var todayReservations = await _db.Reservations
                .CountAsync(r => r.ReservedAt >= startOfTodayVn && r.ReservedAt < startOfTodayVn.AddDays(1));

            var reservationStatus = await _db.Reservations
                .GroupBy(r => r.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToListAsync();

            // Active Orders Count (in progress)
            var activeOrdersCount = await _db.Orders
                .CountAsync(o => o.Status != "CLOSED" && o.Status != "CANCELLED");

            // ────────────────────────────────────────────────────────
            // 2. MANAGER VIEW (OPERATIONS & DAILY TIMELINES)
            // ────────────────────────────────────────────────────────
            
            // Today's Reservations detail list
            var todayReservationsList = await _db.Reservations
                .Where(r => r.ReservedAt >= startOfTodayVn && r.ReservedAt < startOfTodayVn.AddDays(1))
                .OrderBy(r => r.ReservedAt)
                .Select(r => new {
                    r.ReservationId,
                    r.CustomerName,
                    r.CustomerPhone,
                    r.ReservedAt,
                    r.Status,
                    r.DurationMinutes,
                    r.TotalTables,
                    r.DepositAmount,
                    r.ContactEmail
                })
                .ToListAsync();

            // Full table status map
            var tableStatusList = await _db.DiningTables
                .Where(t => t.IsActive == true)
                .OrderBy(t => t.TableCode)
                .Select(t => new {
                    t.TableId,
                    t.TableCode,
                    t.Capacity,
                    t.Status
                })
                .ToListAsync();

            // Kitchen Status item queue counts
            var kitchenStatus = await _db.OrderItems
                .Where(oi => oi.Status == "PENDING" || oi.Status == "COOKING")
                .GroupBy(oi => oi.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToListAsync();

            // Low Stock warnings (< 15 units threshold)
            var stockSummary = await _db.StockMovements
                .GroupBy(sm => sm.IngredientId)
                .Select(g => new {
                    IngredientId = g.Key,
                    Stock = g.Sum(sm => sm.MovementType == "IN" ? sm.Quantity : -sm.Quantity)
                })
                .ToListAsync();

            var activeIngredients = await _db.Ingredients.Where(i => i.IsActive == true).ToListAsync();
            var lowStockIngredients = activeIngredients
                .Select(i => new {
                    i.IngredientId,
                    i.IngredientName,
                    i.Unit,
                    Stock = stockSummary.FirstOrDefault(s => s.IngredientId == i.IngredientId)?.Stock ?? 0
                })
                .Where(i => i.Stock < 15)
                .OrderBy(i => i.Stock)
                .ToList();

            // Top selling dishes (last 30 days)
            var topSellers = await _db.OrderItems
                .Where(oi => oi.Order.ClosedAt >= thirtyDaysAgoServer && oi.Order.Invoice != null && oi.Order.Invoice.PaymentStatus == "PAID")
                .GroupBy(oi => oi.ItemNameSnapshot)
                .Select(g => new {
                    Name = g.Key,
                    Quantity = g.Sum(oi => oi.Quantity),
                    Revenue = g.Sum(oi => oi.LineTotal)
                })
                .OrderByDescending(x => x.Quantity)
                .Take(5)
                .ToListAsync();

            // 7-day daily revenue data
            var last7DaysInvoices = await _db.Invoices
                .Where(i => i.PaymentStatus == "PAID" && i.IssuedAt >= sevenDaysAgoServer)
                .Select(i => new { i.IssuedAt, i.TotalAmount })
                .ToListAsync();

            var dailyRevenueChart = Enumerable.Range(0, 7)
                .Select(offset => serverToday.AddDays(-offset))
                .Select(date => new {
                    Date = date.ToString("yyyy-MM-dd"),
                    DayOfWeek = date.DayOfWeek.ToString(),
                    Revenue = last7DaysInvoices.Where(i => i.IssuedAt.Date == date).Sum(i => i.TotalAmount)
                })
                .OrderBy(d => d.Date)
                .ToList();

            // ────────────────────────────────────────────────────────
            // 3. ADMIN VIEW (FINANCIAL & ANALYTICS OVERVIEW)
            // ────────────────────────────────────────────────────────
            
            // Financial stats (last 30 days)
            var invoices30Days = await _db.Invoices
                .Where(i => i.PaymentStatus == "PAID" && i.IssuedAt >= thirtyDaysAgoServer)
                .ToListAsync();

            var totalSales30Days = invoices30Days.Sum(i => i.TotalAmount);
            var totalDiscounts30Days = invoices30Days.Sum(i => i.DiscountAmount);
            var totalVat30Days = invoices30Days.Sum(i => i.VatAmount);
            var paidInvoicesCount = invoices30Days.Count;
            var aov30Days = paidInvoicesCount > 0 ? totalSales30Days / paidInvoicesCount : 0;

            // Restocking costs (last 30 days)
            var restockingCost30Days = await _db.PurchaseReceipts
                .Where(pr => pr.Status == "RECEIVED" && pr.ReceiptDate >= thirtyDaysAgoServer)
                .SumAsync(pr => (decimal?)pr.TotalAmount) ?? 0;

            var netProfit30Days = totalSales30Days - restockingCost30Days;

            // 7-Day sales vs restocking expenses chart
            var last7DaysReceipts = await _db.PurchaseReceipts
                .Where(pr => pr.Status == "RECEIVED" && pr.ReceiptDate >= sevenDaysAgoServer)
                .Select(pr => new { pr.ReceiptDate, pr.TotalAmount })
                .ToListAsync();

            var dailyRevenueExpenseChart = Enumerable.Range(0, 7)
                .Select(offset => serverToday.AddDays(-offset))
                .Select(date => new {
                    Date = date.ToString("yyyy-MM-dd"),
                    DayOfWeek = date.DayOfWeek.ToString(),
                    Revenue = last7DaysInvoices.Where(i => i.IssuedAt.Date == date).Sum(i => i.TotalAmount),
                    Expense = last7DaysReceipts.Where(pr => pr.ReceiptDate.Date == date).Sum(pr => pr.TotalAmount)
                })
                .OrderBy(d => d.Date)
                .ToList();

            // Users counts
            var totalCustomers = await _db.Customers.CountAsync();
            var totalStaff = await _db.Staffs.CountAsync(s => s.WorkingStatus == "ACTIVE");

            // New customer registration chart (last 7 days)
            var newCustomersList = await _db.Customers
                .Where(c => c.CreatedAt >= sevenDaysAgoServer)
                .Select(c => new { c.CreatedAt })
                .ToListAsync();

            var newRegistrationsChart = Enumerable.Range(0, 7)
                .Select(offset => serverToday.AddDays(-offset))
                .Select(date => new {
                    Date = date.ToString("yyyy-MM-dd"),
                    DayOfWeek = date.DayOfWeek.ToString(),
                    Count = newCustomersList.Count(c => c.CreatedAt.Date == date)
                })
                .OrderBy(d => d.Date)
                .ToList();

            // Loyalty tier distribution
            var tiers = await _db.LoyaltyTiers.Where(t => t.IsActive == true).OrderBy(t => t.MinPoints).ToListAsync();
            var customerPoints = await _db.Customers.Select(c => c.TotalPoints).ToListAsync();
            var loyaltyTiers = tiers.Select((t, index) => {
                var nextMin = index + 1 < tiers.Count ? tiers[index + 1].MinPoints : int.MaxValue;
                var count = customerPoints.Count(pts => pts >= t.MinPoints && pts < nextMin);
                return new {
                    TierName = t.TierName,
                    MinPoints = t.MinPoints,
                    DiscountRate = t.DiscountRate,
                    Count = count
                };
            }).ToList();

            // Payment method share (last 30 days)
            var paymentMethodShare = await _db.Payments
                .Where(p => p.PaidAt >= thirtyDaysAgoServer)
                .GroupBy(p => p.Method)
                .Select(g => new {
                    Method = g.Key,
                    Amount = g.Sum(p => p.Amount)
                })
                .ToListAsync();

            // Order type split (last 30 days)
            var orderTypeShare = await _db.Invoices
                .Where(i => i.PaymentStatus == "PAID" && i.IssuedAt >= thirtyDaysAgoServer)
                .GroupBy(i => i.Order.OrderType)
                .Select(g => new {
                    OrderType = g.Key,
                    Revenue = g.Sum(i => i.TotalAmount)
                })
                .ToListAsync();

            // Staff performance rankings (last 30 days)
            var staffPerformance = await _db.Invoices
                .Where(i => i.PaymentStatus == "PAID" && i.IssuedAt >= thirtyDaysAgoServer)
                .GroupBy(i => i.IssuedByStaff.FullName)
                .Select(g => new {
                    StaffName = g.Key ?? "Unknown",
                    InvoicesCount = g.Count(),
                    Revenue = g.Sum(i => i.TotalAmount)
                })
                .OrderByDescending(x => x.Revenue)
                .Take(5)
                .ToListAsync();

            // Coupon / Discount usage statistics
            var discountStats = await _db.DiscountCodes
                .Select(d => new {
                    d.Code,
                    d.DiscountType,
                    d.DiscountValue,
                    d.UsedCount,
                    d.MaxUses,
                    d.IsActive
                })
                .OrderByDescending(d => d.UsedCount)
                .Take(5)
                .ToListAsync();

            // Recent inventory audits (last 5)
            var recentAudits = await _db.InventoryAudits
                .OrderByDescending(a => a.AuditDate)
                .Take(5)
                .Select(a => new {
                    a.AuditCode,
                    a.AuditDate,
                    StaffName = a.Staff.FullName,
                    ItemsCount = a.AuditItems.Count,
                    a.Note
                })
                .ToListAsync();

            var vatEnabledOpt = await _db.SystemConfigs.FirstOrDefaultAsync(c => c.ConfigKey == "VAT_ENABLED");
            var vatRateOpt = await _db.SystemConfigs.FirstOrDefaultAsync(c => c.ConfigKey == "VAT_RATE");
            var vatEnabled = vatEnabledOpt?.ConfigValue ?? "false";
            var vatRate = vatRateOpt?.ConfigValue ?? "0";

            return Success(new {
                VatEnabled = vatEnabled,
                VatRate = vatRate,

                // Common Overview
                DailyRevenue = dailyRevenue,
                MonthlyRevenue = monthlyRevenue,
                TotalTables = totalTables,
                OccupiedTables = occupiedTables,
                TodayReservations = todayReservations,
                ActiveOrdersCount = activeOrdersCount,
                ReservationStatus = reservationStatus,
                TopSellers = topSellers,

                // Manager operational metrics
                TodayReservationsList = todayReservationsList,
                TableStatusList = tableStatusList,
                KitchenStatus = kitchenStatus,
                LowStockIngredients = lowStockIngredients,

                // Admin financial metrics
                TotalSales30Days = totalSales30Days,
                RestockingCost30Days = restockingCost30Days,
                NetProfit30Days = netProfit30Days,
                Aov30Days = aov30Days,
                TotalDiscounts30Days = totalDiscounts30Days,
                TotalVat30Days = totalVat30Days,
                TotalCustomers = totalCustomers,
                TotalStaff = totalStaff,
                LoyaltyTiers = loyaltyTiers,
                PaymentMethodShare = paymentMethodShare,
                OrderTypeShare = orderTypeShare,
                StaffPerformance = staffPerformance,
                DiscountStats = discountStats,
                RecentAudits = recentAudits,

                // Charts
                DailyRevenueChart = dailyRevenueChart, // Backwards compatibility if needed
                SalesExpenseChart = dailyRevenueExpenseChart,
                NewRegistrationsChart = newRegistrationsChart
            });
        }
        catch (Exception ex)
        {
            return Failure($"Không thể tải số liệu thống kê: {ex.Message}");
        }
    }
}
