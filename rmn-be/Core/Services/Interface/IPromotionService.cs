using SEP_Restaurant_management.Core.DTOs;

namespace SEP_Restaurant_management.Core.Services.Interface;

public interface IPromotionService
{
    // System Config
    Task<List<SystemConfigDTO>> GetAllConfigsAsync();
    Task<SystemConfigDTO?> GetConfigByKeyAsync(string key);
    Task<SystemConfigDTO> UpdateConfigAsync(UpdateSystemConfigDTO request);
    Task<List<SystemConfigDTO>> UpdateMultipleConfigsAsync(List<UpdateSystemConfigDTO> requests);

    // Discount Code
    Task<List<DiscountCodeDTO>> GetAllDiscountCodesAsync(bool? isActive = null);
    Task<DiscountCodeDTO?> GetDiscountCodeAsync(int id);
    Task<DiscountCodeDTO?> GetDiscountCodeByCodeAsync(string code);
    Task<DiscountCodeDTO> CreateDiscountCodeAsync(CreateDiscountCodeDTO request);
    Task<DiscountCodeDTO> UpdateDiscountCodeAsync(int id, UpdateDiscountCodeDTO request);
    Task DeleteDiscountCodeAsync(int id);
    Task<DiscountCodeDTO> ToggleDiscountCodeAsync(int id);

    // Loyalty Tier
    Task<List<LoyaltyTierDTO>> GetAllLoyaltyTiersAsync();
    Task<LoyaltyTierDTO> UpdateLoyaltyTierAsync(int id, UpdateLoyaltyTierDTO request);

    // Loyalty Ledger
    Task<List<LoyaltyLedgerDTO>> GetLoyaltyLedgersAsync(long? customerId = null);
}
