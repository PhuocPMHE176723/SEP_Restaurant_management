using System.Collections.Generic;
using System.Threading.Tasks;
using SEP_Restaurant_management.Core.Models;

namespace SEP_Restaurant_management.Core.Services.Interface;

public interface INotificationService
{
    Task<Notification> CreateNotificationAsync(string title, string message, string type, string? userId = null, string? role = null, string? relatedId = null);
    Task<List<Notification>> GetNotificationsForUserAsync(string? userId, List<string> roles);
    Task<bool> MarkAsReadAsync(long notificationId);
    Task<bool> MarkAllAsReadForUserAsync(string? userId, List<string> roles);
}
