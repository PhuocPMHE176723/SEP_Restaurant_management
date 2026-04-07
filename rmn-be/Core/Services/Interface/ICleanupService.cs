using System.Threading.Tasks;

namespace SEP_Restaurant_management.Core.Services.Interface;

public interface ICleanupService
{
    Task<(int ordersCancelled, int reservationsCleared, int tablesReleased)> DoDailyCleanupAsync();
}
