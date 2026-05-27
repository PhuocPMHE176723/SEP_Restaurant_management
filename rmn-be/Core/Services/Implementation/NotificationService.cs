using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Services.Interface;

namespace SEP_Restaurant_management.Core.Services.Implementation;

public class NotificationService : INotificationService
{
    private readonly SepDatabaseContext _context;

    public NotificationService(SepDatabaseContext context)
    {
        _context = context;
    }

    public async Task<Notification> CreateNotificationAsync(
        string title,
        string message,
        string type,
        string? userId = null,
        string? role = null,
        string? relatedId = null
    )
    {
        var notification = new Notification
        {
            Title = title,
            Message = message,
            Type = type.ToUpper(),
            UserId = userId,
            Role = role,
            RelatedId = relatedId,
            IsRead = false,
            CreatedAt = DateTime.UtcNow
        };

        _context.Notifications.Add(notification);
        await _context.SaveChangesAsync();
        return notification;
    }

    public async Task<List<Notification>> GetNotificationsForUserAsync(string? userId, List<string> roles)
    {
        var queryRoles = roles != null ? new List<string>(roles) : new List<string>();
        if (queryRoles.Any(r => r == "Staff" || r == "Manager" || r == "Cashier" || r == "Warehouse" || r == "Kitchen"))
        {
            if (!queryRoles.Contains("Staff")) queryRoles.Add("Staff");
            if (!queryRoles.Contains("Manager")) queryRoles.Add("Manager");
            if (!queryRoles.Contains("Cashier")) queryRoles.Add("Cashier");
        }

        var query = _context.Notifications.AsQueryable();

        if (!string.IsNullOrEmpty(userId) && queryRoles.Any())
        {
            query = query.Where(n => n.UserId == userId || queryRoles.Contains(n.Role!) || (n.UserId == null && n.Role == null));
        }
        else if (!string.IsNullOrEmpty(userId))
        {
            query = query.Where(n => n.UserId == userId || (n.UserId == null && n.Role == null));
        }
        else if (queryRoles.Any())
        {
            query = query.Where(n => queryRoles.Contains(n.Role!) || (n.UserId == null && n.Role == null));
        }
        else
        {
            query = query.Where(n => n.UserId == null && n.Role == null);
        }

        return await query.OrderByDescending(n => n.CreatedAt).Take(50).ToListAsync();
    }

    public async Task<bool> MarkAsReadAsync(long notificationId)
    {
        var notification = await _context.Notifications.FindAsync(notificationId);
        if (notification == null) return false;

        notification.IsRead = true;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> MarkAllAsReadForUserAsync(string? userId, List<string> roles)
    {
        var queryRoles = roles != null ? new List<string>(roles) : new List<string>();
        if (queryRoles.Any(r => r == "Staff" || r == "Manager" || r == "Cashier" || r == "Warehouse" || r == "Kitchen"))
        {
            if (!queryRoles.Contains("Staff")) queryRoles.Add("Staff");
            if (!queryRoles.Contains("Manager")) queryRoles.Add("Manager");
            if (!queryRoles.Contains("Cashier")) queryRoles.Add("Cashier");
        }

        var query = _context.Notifications.Where(n => !n.IsRead);

        if (!string.IsNullOrEmpty(userId) && queryRoles.Any())
        {
            query = query.Where(n => n.UserId == userId || queryRoles.Contains(n.Role!) || (n.UserId == null && n.Role == null));
        }
        else if (!string.IsNullOrEmpty(userId))
        {
            query = query.Where(n => n.UserId == userId || (n.UserId == null && n.Role == null));
        }
        else if (queryRoles.Any())
        {
            query = query.Where(n => queryRoles.Contains(n.Role!) || (n.UserId == null && n.Role == null));
        }
        else
        {
            query = query.Where(n => n.UserId == null && n.Role == null);
        }

        var unreadNotifications = await query.ToListAsync();
        foreach (var n in unreadNotifications)
        {
            n.IsRead = true;
        }

        await _context.SaveChangesAsync();
        return true;
    }
}
