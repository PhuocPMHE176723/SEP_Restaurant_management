using SEP_Restaurant_management.Core.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SEP_Restaurant_management.Core.Services.Interface
{
    public interface IPurchaseReceiptService
    {
        Task<IEnumerable<PurchaseReceiptResponse>> GetAllAsync();
        Task<PurchaseReceiptResponse?> GetByIdAsync(long id);
        Task<PurchaseReceiptResponse> CreateAsync(CreatePurchaseReceiptRequest dto, long? createdByStaffId);
        Task<bool> UpdateStatusAsync(long id, string status);
    }

    public interface IStockService
    {
        Task<IEnumerable<InventoryOnHandResponse>> GetInventoryOnHandAsync();
        Task<IEnumerable<InventoryOnHandResponse>> GetLowStockAsync(decimal threshold = 10);
        Task<IEnumerable<StockMovementResponse>> GetMovementsAsync();
        Task<StockMovementResponse> CreateManualAdjustmentAsync(ManualAdjustmentRequest dto, long? staffId);
    }
}
