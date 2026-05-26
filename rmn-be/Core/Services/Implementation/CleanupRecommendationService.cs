using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Middlewares;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Services.Interface;

namespace SEP_Restaurant_management.Core.Services.Implementation;

public class CleanupRecommendationService : ICleanupRecommendationService
{
    private readonly SepDatabaseContext _context;

    public CleanupRecommendationService(SepDatabaseContext context)
    {
        _context = context;
    }

    public async Task<CleanupRecommendationDTO> GetRecommendationsAsync(DateTime? date = null)
    {
        var today = (date ?? DateTimeHelper.VietnamNow()).Date;
        var now = DateTimeHelper.VietnamNow();

        var reservations = await _context
            .Reservations.Where(r =>
                r.ReservedAt.Date == today
                && (r.Status == "PENDING" || r.Status == "CONFIRMED" || r.Status == "CHECKED_IN")
            )
            .ToListAsync();

        var intervals = reservations
            .Select(r =>
                (
                    Start: r.ReservedAt,
                    End: r.ReservedAt.AddMinutes(r.DurationMinutes > 0 ? r.DurationMinutes : 90)
                )
            )
            .OrderBy(i => i.Start)
            .ToList();

        var lunchBaseStart = today.AddHours(14);
        var lunchBaseEnd = today.AddHours(15);
        var lunchWindow = PickWindow(
            intervals,
            today.AddHours(13.5),
            today.AddHours(15.5),
            60,
            lunchBaseStart,
            lunchBaseEnd
        );

        var nightBaseStart = today.AddHours(21.5);
        var nightBaseEnd = today.AddHours(23);
        var nightWindow = PickWindow(
            intervals,
            today.AddHours(21),
            today.AddHours(23.5),
            90,
            nightBaseStart,
            nightBaseEnd
        );

        var windows = new List<CleanupWindowDTO>
        {
            new CleanupWindowDTO
            {
                Label = "Dọn dẹp trưa",
                Start = lunchWindow.Start,
                End = lunchWindow.End,
            },
            new CleanupWindowDTO
            {
                Label = "Dọn dẹp tối",
                Start = nightWindow.Start,
                End = nightWindow.End,
            },
        };

        var activeOrders = await _context
            .Orders.Include(o => o.Table)
            .Include(o => o.OrderTables)
                .ThenInclude(ot => ot.DiningTable)
            .Where(o => o.Status == "OPEN" || o.Status == "SENT_TO_KITCHEN" || o.Status == "SERVED")
            .ToListAsync();

        var tableToOrder = new Dictionary<int, Order>();
        foreach (var order in activeOrders)
        {
            if (order.TableId.HasValue)
            {
                tableToOrder[order.TableId.Value] = order;
            }

            foreach (var ot in order.OrderTables)
            {
                tableToOrder[ot.TableId] = order;
            }
        }

        var tableIds = tableToOrder.Keys.ToList();
        var tables = await _context
            .DiningTables.Where(t => tableIds.Contains(t.TableId))
            .ToListAsync();

        var nextWindowStart = windows
            .Select(w => w.Start)
            .Where(s => s >= now)
            .OrderBy(s => s)
            .FirstOrDefault();

        var reminders = new List<TableReminderDTO>();
        foreach (var table in tables)
        {
            if (!tableToOrder.TryGetValue(table.TableId, out var order))
                continue;

            var minutesOccupied = (int)Math.Max(0, (now - order.OpenedAt).TotalMinutes);
            var expectedMax = now.Hour < 16 ? 90 : 120;
            var timeToCleanup =
                nextWindowStart != default ? (nextWindowStart - now).TotalMinutes : (double?)null;

            var reason = string.Empty;
            var priority = 0;

            if (minutesOccupied >= expectedMax)
            {
                reason = "Quá thời lượng phục vụ";
                priority = 2;
            }
            else if (timeToCleanup.HasValue && timeToCleanup.Value <= 30)
            {
                reason = "Sắp đến giờ dọn dẹp";
                priority = 1;
            }

            if (priority > 0)
            {
                reminders.Add(
                    new TableReminderDTO
                    {
                        TableId = table.TableId,
                        TableCode = table.TableCode,
                        TableName = table.TableName,
                        Status = table.Status,
                        OrderId = order.OrderId,
                        OrderOpenedAt = order.OpenedAt,
                        MinutesOccupied = minutesOccupied,
                        Reason = reason,
                        Priority = priority,
                    }
                );
            }
        }

        reminders = reminders
            .OrderByDescending(r => r.Priority)
            .ThenByDescending(r => r.MinutesOccupied)
            .ToList();

        return new CleanupRecommendationDTO
        {
            Date = today,
            GeneratedAt = now,
            Windows = windows,
            Reminders = reminders,
        };
    }

    private static (DateTime Start, DateTime End) PickWindow(
        List<(DateTime Start, DateTime End)> intervals,
        DateTime searchStart,
        DateTime searchEnd,
        int durationMinutes,
        DateTime baseStart,
        DateTime baseEnd
    )
    {
        var merged = MergeIntervals(intervals, searchStart, searchEnd);
        var baseDuration = (int)(baseEnd - baseStart).TotalMinutes;
        var duration = Math.Max(durationMinutes, baseDuration);
        var baseMid = baseStart.AddMinutes(duration / 2.0);

        var gaps = new List<(DateTime Start, DateTime End)>();
        var cursor = searchStart;
        foreach (var interval in merged)
        {
            if (interval.Start > cursor)
            {
                gaps.Add((cursor, interval.Start));
            }
            cursor = interval.End > cursor ? interval.End : cursor;
        }
        if (cursor < searchEnd)
        {
            gaps.Add((cursor, searchEnd));
        }

        var candidates = gaps.Where(g => (g.End - g.Start).TotalMinutes >= duration).ToList();

        if (candidates.Count == 0)
        {
            return (baseStart, baseEnd);
        }

        (DateTime Start, DateTime End) best = candidates[0];
        double bestScore = double.MaxValue;
        foreach (var gap in candidates)
        {
            var start = Clamp(baseStart, gap.Start, gap.End.AddMinutes(-duration));
            var end = start.AddMinutes(duration);
            var mid = start.AddMinutes(duration / 2.0);
            var score = Math.Abs((mid - baseMid).TotalMinutes);
            if (score < bestScore)
            {
                bestScore = score;
                best = (start, end);
            }
        }

        return best;
    }

    private static List<(DateTime Start, DateTime End)> MergeIntervals(
        List<(DateTime Start, DateTime End)> intervals,
        DateTime searchStart,
        DateTime searchEnd
    )
    {
        var filtered = intervals
            .Where(i => i.End > searchStart && i.Start < searchEnd)
            .OrderBy(i => i.Start)
            .ToList();

        var merged = new List<(DateTime Start, DateTime End)>();
        foreach (var interval in filtered)
        {
            if (merged.Count == 0)
            {
                merged.Add(interval);
                continue;
            }

            var last = merged[^1];
            if (interval.Start <= last.End)
            {
                merged[^1] = (last.Start, interval.End > last.End ? interval.End : last.End);
            }
            else
            {
                merged.Add(interval);
            }
        }

        return merged;
    }

    private static DateTime Clamp(DateTime value, DateTime min, DateTime max)
    {
        if (value < min)
            return min;
        if (value > max)
            return max;
        return value;
    }
}
