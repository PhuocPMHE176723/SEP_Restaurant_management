using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Middlewares;
using SEP_Restaurant_management.Core.Services.Interface;

namespace SEP_Restaurant_management.Core.Services.Implementation;

public class CleanupService : ICleanupService
{
    private readonly SepDatabaseContext _context;

    public CleanupService(SepDatabaseContext context)
    {
        _context = context;
    }

    public async Task<(int ordersCancelled, int reservationsCleared, int tablesReleased)> DoDailyCleanupAsync()
    {
        var today = DateTimeHelper.VietnamNow().Date;
        int tablesReleased = 0;
        int ordersCancelled = 0;
        int reservationsCleared = 0;

        // 1. Release active orders from previous days
        var staleOrders = await _context.Orders
            .Include(o => o.Table)
            .Where(o => (o.Status == "OPEN" || o.Status == "SENT_TO_KITCHEN" || o.Status == "SERVED") 
                        && o.OpenedAt.Date < today)
            .ToListAsync();

        foreach (var order in staleOrders)
        {
            order.Status = "CANCELLED";
            order.ClosedAt = DateTimeHelper.VietnamNow();
            order.Note = (order.Note + " [Auto-cancelled by Daily Cleanup]").Trim();

            if (order.Table != null)
            {
                order.Table.Status = "AVAILABLE";
                tablesReleased++;
                
                if (!string.IsNullOrEmpty(order.Note) && order.Note.Contains("[Tables:"))
                {
                    tablesReleased += await ReleaseExtraTables(order.Note);
                }
            }
            ordersCancelled++;
        }

        // 2. Clear stale reservations
        var staleReservations = await _context.Reservations
            .Include(r => r.Table)
            .Where(r => (r.Status == "PENDING" || r.Status == "CONFIRMED") 
                        && r.ReservedAt.Date < today)
            .ToListAsync();

        foreach (var res in staleReservations)
        {
            string oldStatus = res.Status;
            res.Status = oldStatus == "CONFIRMED" ? "NO_SHOW" : "CANCELLED";
            res.Note = (res.Note + $" [Auto-{res.Status} by Daily Cleanup]").Trim();

            if (res.Table != null)
            {
                res.Table.Status = "AVAILABLE";
                tablesReleased++;
            }
            reservationsCleared++;
        }

        // 3. Safety check for stuck tables
        var occupiedTables = await _context.DiningTables
            .Where(t => t.Status == "OCCUPIED" || t.Status == "RESERVED")
            .ToListAsync();

        foreach (var table in occupiedTables)
        {
            bool hasActiveOrder = await _context.Orders.AnyAsync(o => 
                o.TableId == table.TableId && 
                (o.Status == "OPEN" || o.Status == "SENT_TO_KITCHEN" || o.Status == "SERVED") &&
                o.OpenedAt.Date >= today);

            bool hasActiveReservation = await _context.Reservations.AnyAsync(r =>
                r.TableId == table.TableId &&
                (r.Status == "CONFIRMED") &&
                r.ReservedAt.Date >= today);

            if (!hasActiveOrder && !hasActiveReservation)
            {
                table.Status = "AVAILABLE";
                tablesReleased++;
            }
        }

        await _context.SaveChangesAsync();
        return (ordersCancelled, reservationsCleared, tablesReleased);
    }

    private async Task<int> ReleaseExtraTables(string note)
    {
        int releasedCount = 0;
        try
        {
            var startIdx = note.IndexOf("[Tables:");
            if (startIdx == -1) return 0;
            
            var endIdx = note.IndexOf(']', startIdx);
            if (endIdx == -1) return 0;

            var tableIdsStr = note.Substring(startIdx + 8, endIdx - (startIdx + 8));
            var tableIds = tableIdsStr.Split(',')
                .Select(s => int.TryParse(s, out var id) ? id : (int?)null)
                .Where(id => id.HasValue)
                .Select(id => id!.Value)
                .ToList();

            var extraTables = await _context.DiningTables
                .Where(t => tableIds.Contains(t.TableId))
                .ToListAsync();

            foreach (var table in extraTables)
            {
                if (table.Status != "AVAILABLE") {
                    table.Status = "AVAILABLE";
                    releasedCount++;
                }
            }
        }
        catch { /* Ignore */ }
        return releasedCount;
    }
}
