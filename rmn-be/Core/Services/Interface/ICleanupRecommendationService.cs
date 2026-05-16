using System;
using System.Threading.Tasks;
using SEP_Restaurant_management.Core.DTOs;

namespace SEP_Restaurant_management.Core.Services.Interface;

public interface ICleanupRecommendationService
{
    Task<CleanupRecommendationDTO> GetRecommendationsAsync(DateTime? date = null);
}
