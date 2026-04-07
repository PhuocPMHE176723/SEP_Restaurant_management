using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using SEP_Restaurant_management.Core.Data;
using SEP_Restaurant_management.Core.Middlewares;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Services.Interface;

namespace SEP_Restaurant_management.Core.ProgramConfig;

/// <summary>
/// Background service that runs daily to clean up stale orders and reservations.
/// This ensures tables are released for the next business day.
/// </summary>
public class DailyTableCleanupService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<DailyTableCleanupService> _logger;

    public DailyTableCleanupService(IServiceProvider serviceProvider, ILogger<DailyTableCleanupService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Daily Table Cleanup Service is starting.");

        while (!stoppingToken.IsCancellationRequested)
        {
            var now = DateTimeHelper.VietnamNow();
            
            // Calculate time until 4:00 AM tomorrow
            var nextRunTime = now.Date.AddDays(1).AddHours(4);
            var delay = nextRunTime - now;

            _logger.LogInformation("Next cleanup scheduled for {NextRunTime} (in {Delay} hours)", nextRunTime, delay.TotalHours);

            // Wait until the scheduled time or until cancellation
            try
            {
                await Task.Delay(delay, stoppingToken);
            }
            catch (OperationCanceledException)
            {
                break;
            }

            await DoCleanupWork();
        }

        _logger.LogInformation("Daily Table Cleanup Service is stopping.");
    }

    public async Task DoCleanupWork()
    {
        _logger.LogInformation("Starting daily cleanup at {Time}", DateTimeHelper.VietnamNow());

        using var scope = _serviceProvider.CreateScope();
        var cleanupService = scope.ServiceProvider.GetRequiredService<ICleanupService>();

        try
        {
            var results = await cleanupService.DoDailyCleanupAsync();

            _logger.LogInformation("Cleanup complete: {Orders} orders cancelled, {Res} reservations cleared, {Tables} tables released.", 
                results.ordersCancelled, results.reservationsCleared, results.tablesReleased);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error during daily cleanup background task");
        }
    }
}
