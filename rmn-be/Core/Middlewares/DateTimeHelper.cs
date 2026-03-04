using System;

namespace SEP_Restaurant_management.Core.Middlewares;

/// <summary>
/// Helper class for handling DateTime with Vietnam timezone (UTC+7)
/// </summary>
public static class DateTimeHelper
{
    private static readonly TimeZoneInfo VietnamTimeZone = 
        TimeZoneInfo.FindSystemTimeZoneById("SE Asia Standard Time"); // UTC+7

    /// <summary>
    /// Get current time in Vietnam timezone
    /// </summary>
    public static DateTime VietnamNow()
    {
        return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, VietnamTimeZone);
    }

    /// <summary>
    /// Convert UTC time to Vietnam time
    /// </summary>
    public static DateTime ToVietnamTime(DateTime utcDateTime)
    {
        if (utcDateTime.Kind != DateTimeKind.Utc)
        {
            utcDateTime = DateTime.SpecifyKind(utcDateTime, DateTimeKind.Utc);
        }
        return TimeZoneInfo.ConvertTimeFromUtc(utcDateTime, VietnamTimeZone);
    }

    /// <summary>
    /// Convert Vietnam time to UTC
    /// </summary>
    public static DateTime ToUtc(DateTime vietnamDateTime)
    {
        if (vietnamDateTime.Kind == DateTimeKind.Utc)
        {
            return vietnamDateTime;
        }
        
        var vietnamTime = DateTime.SpecifyKind(vietnamDateTime, DateTimeKind.Unspecified);
        return TimeZoneInfo.ConvertTimeToUtc(vietnamTime, VietnamTimeZone);
    }
}
