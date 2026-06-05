using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Middlewares;
using System;
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

            // 1. Revenue stats (from paid invoices in server local time)
            var dailyRevenue = await _db.Invoices
                .Where(i => i.PaymentStatus == "PAID" && i.IssuedAt >= startOfTodayServer)
                .SumAsync(i => (decimal?)i.TotalAmount) ?? 0;

            var startOfMonthServer = new DateTime(serverToday.Year, serverToday.Month, 1);
            var monthlyRevenue = await _db.Invoices
                .Where(i => i.PaymentStatus == "PAID" && i.IssuedAt >= startOfMonthServer)
                .SumAsync(i => (decimal?)i.TotalAmount) ?? 0;

            // 2. Table stats
            var totalTables = await _db.DiningTables.CountAsync(t => t.IsActive == true);
            var occupiedTables = await _db.DiningTables.CountAsync(t => t.IsActive == true && t.Status == "OCCUPIED");

            // 3. Reservation stats (in Vietnam local time)
            var todayReservations = await _db.Reservations
                .CountAsync(r => r.ReservedAt >= startOfTodayVn && r.ReservedAt < startOfTodayVn.AddDays(1));

            var reservationStatus = await _db.Reservations
                .GroupBy(r => r.Status)
                .Select(g => new { Status = g.Key, Count = g.Count() })
                .ToListAsync();

            // 4. Low stock ingredients (< 15 units threshold)
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
                .Where(i => i.Stock < 15) // Warning threshold 15 units
                .OrderBy(i => i.Stock)
                .Take(5)
                .ToList();

            // 5. Daily revenue for the last 7 days (line chart)
            var sevenDaysAgoServer = serverToday.AddDays(-6);
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

            // 6. Top selling menu items (last 30 days)
            var thirtyDaysAgoServer = serverToday.AddDays(-29);
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

            // 7. High-level Admin metrics
            var totalCustomers = await _db.Customers.CountAsync();
            var totalStaff = await _db.Staffs.CountAsync(s => s.WorkingStatus == "ACTIVE");

            // 8. Staff performance (sales handled)
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

            return Success(new {
                DailyRevenue = dailyRevenue,
                MonthlyRevenue = monthlyRevenue,
                TotalTables = totalTables,
                OccupiedTables = occupiedTables,
                TodayReservations = todayReservations,
                ReservationStatus = reservationStatus,
                LowStockIngredients = lowStockIngredients,
                DailyRevenueChart = dailyRevenueChart,
                TopSellers = topSellers,
                TotalCustomers = totalCustomers,
                TotalStaff = totalStaff,
                StaffPerformance = staffPerformance
            });
        }
        catch (Exception ex)
        {
            return Failure($"Không thể tải số liệu thống kê: {ex.Message}");
        }
    }
}
