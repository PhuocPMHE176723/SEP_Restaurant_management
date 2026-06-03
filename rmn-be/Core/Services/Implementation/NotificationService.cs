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
        if (string.IsNullOrEmpty(userId))
        {
            return new List<Notification>();
        }

        var queryRoles = roles != null 
            ? roles.Select(r => r.Trim()).ToList() 
            : new List<string>();

        bool isManager = queryRoles.Any(r => string.Equals(r, "Manager", StringComparison.OrdinalIgnoreCase) || string.Equals(r, "Admin", StringComparison.OrdinalIgnoreCase));
        bool isStaff = queryRoles.Any(r => string.Equals(r, "Staff", StringComparison.OrdinalIgnoreCase));
        bool isCashier = queryRoles.Any(r => string.Equals(r, "Cashier", StringComparison.OrdinalIgnoreCase));

        var allowedTypes = new List<string>();
        if (isManager)
        {
            allowedTypes.Add("CHECKIN");
            allowedTypes.Add("PAYMENT");
            allowedTypes.Add("RESERVATION");
            allowedTypes.Add("CLEANUP");
            allowedTypes.Add("SYSTEM");
        }
        else if (isStaff || isCashier)
        {
            allowedTypes.Add("CHECKIN");
            allowedTypes.Add("PAYMENT");
            allowedTypes.Add("RESERVATION");
            allowedTypes.Add("SYSTEM");
        }

        bool hasStaffRole = isStaff || isManager || isCashier || 
                            queryRoles.Any(r => string.Equals(r, "Kitchen", StringComparison.OrdinalIgnoreCase)) ||
                            queryRoles.Any(r => string.Equals(r, "Warehouse", StringComparison.OrdinalIgnoreCase));

        var query = _context.Notifications.AsQueryable();

        if (hasStaffRole)
        {
            query = query.Where(n => 
                n.UserId == userId || 
                (n.UserId == null && (
                    (n.Role != null && queryRoles.Contains(n.Role)) ||
                    (n.Role == "Staff" && allowedTypes.Contains(n.Type)) ||
                    (n.Role == null && n.Type == "SYSTEM")
                ))
            );
        }
        else
        {
            query = query.Where(n => n.UserId == userId);
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
        if (string.IsNullOrEmpty(userId))
        {
            return false;
        }

        var queryRoles = roles != null 
            ? roles.Select(r => r.Trim()).ToList() 
            : new List<string>();

        bool isManager = queryRoles.Any(r => string.Equals(r, "Manager", StringComparison.OrdinalIgnoreCase) || string.Equals(r, "Admin", StringComparison.OrdinalIgnoreCase));
        bool isStaff = queryRoles.Any(r => string.Equals(r, "Staff", StringComparison.OrdinalIgnoreCase));
        bool isCashier = queryRoles.Any(r => string.Equals(r, "Cashier", StringComparison.OrdinalIgnoreCase));

        var allowedTypes = new List<string>();
        if (isManager)
        {
            allowedTypes.Add("CHECKIN");
            allowedTypes.Add("PAYMENT");
            allowedTypes.Add("RESERVATION");
            allowedTypes.Add("CLEANUP");
            allowedTypes.Add("SYSTEM");
        }
        else if (isStaff || isCashier)
        {
            allowedTypes.Add("CHECKIN");
            allowedTypes.Add("PAYMENT");
            allowedTypes.Add("RESERVATION");
            allowedTypes.Add("SYSTEM");
        }

        bool hasStaffRole = isStaff || isManager || isCashier || 
                            queryRoles.Any(r => string.Equals(r, "Kitchen", StringComparison.OrdinalIgnoreCase)) ||
                            queryRoles.Any(r => string.Equals(r, "Warehouse", StringComparison.OrdinalIgnoreCase));

        var query = _context.Notifications.Where(n => !n.IsRead);

        if (hasStaffRole)
        {
            query = query.Where(n => 
                n.UserId == userId || 
                (n.UserId == null && (
                    (n.Role != null && queryRoles.Contains(n.Role)) ||
                    (n.Role == "Staff" && allowedTypes.Contains(n.Type)) ||
                    (n.Role == null && n.Type == "SYSTEM")
                ))
            );
        }
        else
        {
            query = query.Where(n => n.UserId == userId);
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
