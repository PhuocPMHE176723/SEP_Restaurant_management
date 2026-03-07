using Microsoft.EntityFrameworkCore;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Services.Interface;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace SEP_Restaurant_management.Core.Services.Implementation
{
    public class StockService : IStockService
    {
        private readonly SepDatabaseContext _context;

        public StockService(SepDatabaseContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<InventoryOnHandResponse>> GetInventoryOnHandAsync()
        {
            // Calculate sum of INs minus sum of OUTs for each ingredient
            var inventory = await _context.Ingredients
                .Where(i => i.IsActive)
                .Select(i => new InventoryOnHandResponse
                {
                    IngredientId = i.IngredientId,
                    IngredientName = i.IngredientName,
                    Unit = i.Unit,
                    MaxStock = i.StockMovements
                                    .Where(m => m.MovementType == "IN")
                                    .Sum(m => m.Quantity),
                    CurrentStock = i.StockMovements
                                    .Where(m => m.MovementType == "IN")
                                    .Sum(m => m.Quantity) -
                                   i.StockMovements
                                    .Where(m => m.MovementType == "OUT")
                                    .Sum(m => m.Quantity)
                })
                .ToListAsync();

            return inventory.OrderBy(i => i.IngredientName);
        }

        public async Task<IEnumerable<InventoryOnHandResponse>> GetLowStockAsync(decimal threshold = 10)
        {
            var inventory = await GetInventoryOnHandAsync();
            return inventory.Where(i => i.CurrentStock <= threshold).ToList();
        }

        public async Task<IEnumerable<StockMovementResponse>> GetMovementsAsync()
        {
            return await _context.StockMovements
                .Include(m => m.Ingredient)
                .Include(m => m.CreatedByStaff)
                .OrderByDescending(m => m.MovedAt)
                .Select(m => new StockMovementResponse
                {
                    MovementId = m.MovementId,
                    IngredientId = m.IngredientId,
                    IngredientName = m.Ingredient.IngredientName,
                    Unit = m.Ingredient.Unit,
                    MovementType = m.MovementType,
                    Quantity = m.Quantity,
                    RefType = m.RefType,
                    RefId = m.RefId,
                    MovedAt = m.MovedAt,
                    CreatedByStaffId = m.CreatedByStaffId,
                    CreatedByStaffName = m.CreatedByStaff != null ? m.CreatedByStaff.FullName : null,
                    Note = m.Note
                })
                .ToListAsync();
        }

        public async Task<StockMovementResponse> CreateManualAdjustmentAsync(ManualAdjustmentRequest dto, long? staffId)
        {
            var ingredient = await _context.Ingredients.FindAsync(dto.IngredientId);
            if (ingredient == null) throw new InvalidOperationException("Nguyên liệu không tồn tại");

            if (dto.MovementType == "OUT")
            {
                if (!ingredient.IsActive)
                    throw new InvalidOperationException("Không thể xuất kho đối với nguyên liệu đã ngừng sử dụng");

                var currentStock = await _context.StockMovements
                    .Where(m => m.IngredientId == dto.IngredientId)
                    .SumAsync(m => m.MovementType == "IN" ? m.Quantity : -m.Quantity);

                if (currentStock < dto.Quantity)
                    throw new InvalidOperationException($"Số lượng xuất ({dto.Quantity}) vượt quá tồn kho hiện tại ({currentStock} {ingredient.Unit})");
            }

            var stockMovement = new StockMovement
            {
                IngredientId = dto.IngredientId,
                MovementType = dto.MovementType,
                Quantity = dto.Quantity,
                RefType = "ADJUSTMENT",
                MovedAt = DateTime.UtcNow,
                CreatedByStaffId = staffId,
                Note = dto.Note
            };

            _context.StockMovements.Add(stockMovement);
            await _context.SaveChangesAsync();

            return new StockMovementResponse
            {
                MovementId = stockMovement.MovementId,
                IngredientId = stockMovement.IngredientId,
                IngredientName = ingredient.IngredientName,
                Unit = ingredient.Unit,
                MovementType = stockMovement.MovementType,
                Quantity = stockMovement.Quantity,
                RefType = stockMovement.RefType,
                MovedAt = stockMovement.MovedAt,
                CreatedByStaffId = stockMovement.CreatedByStaffId,
                Note = stockMovement.Note
            };
        }
    }
}
