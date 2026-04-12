using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Services.Interface;

namespace SEP_Restaurant_management.Core.Services.Implementation
{
    public class PurchaseReceiptService : IPurchaseReceiptService
    {
        private readonly SepDatabaseContext _context;

        public PurchaseReceiptService(SepDatabaseContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<PurchaseReceiptResponse>> GetAllAsync()
        {
            return await _context
                .PurchaseReceipts.Include(r => r.CreatedByStaff)
                .Select(r => new PurchaseReceiptResponse
                {
                    ReceiptId = r.ReceiptId,
                    ReceiptCode = r.ReceiptCode,
                    SupplierId = r.SupplierId,
                    ReceiptDate = r.ReceiptDate,
                    TotalAmount = r.TotalAmount,
                    Status = r.Status,
                    CreatedByStaffId = r.CreatedByStaffId,
                    CreatedByStaffName =
                        r.CreatedByStaff != null ? r.CreatedByStaff.FullName : null,
                    Note = r.Note,
                })
                .OrderByDescending(r => r.ReceiptDate)
                .ToListAsync();
        }

        public async Task<PurchaseReceiptResponse?> GetByIdAsync(long id)
        {
            var r = await _context
                .PurchaseReceipts.Include(r => r.CreatedByStaff)
                .Include(r => r.Items)
                    .ThenInclude(i => i.Ingredient)
                .FirstOrDefaultAsync(x => x.ReceiptId == id);

            if (r == null)
                return null;

            return new PurchaseReceiptResponse
            {
                ReceiptId = r.ReceiptId,
                ReceiptCode = r.ReceiptCode,
                SupplierId = r.SupplierId,
                ReceiptDate = r.ReceiptDate,
                TotalAmount = r.TotalAmount,
                Status = r.Status,
                CreatedByStaffId = r.CreatedByStaffId,
                CreatedByStaffName = r.CreatedByStaff?.FullName,
                Note = r.Note,
                Items = r
                    .Items.Select(i => new PurchaseReceiptItemResponse
                    {
                        ReceiptItemId = i.ReceiptItemId,
                        ReceiptId = i.ReceiptId,
                        IngredientId = i.IngredientId,
                        IngredientName = i.Ingredient.IngredientName,
                        Unit = i.Ingredient.Unit,
                        Quantity = i.Quantity,
                        UnitCost = i.UnitCost,
                        LineTotal = i.LineTotal,
                    })
                    .ToList(),
            };
        }

        public async Task<PurchaseReceiptResponse> CreateAsync(
            CreatePurchaseReceiptRequest dto,
            long? createdByStaffId
        )
        {
            IDbContextTransaction? transaction = null;
            try
            {
                // EF Core InMemory provider does not support transactions.
                if (_context.Database.ProviderName != "Microsoft.EntityFrameworkCore.InMemory")
                {
                    transaction = await _context.Database.BeginTransactionAsync();
                }

                var code = "PR" + DateTime.UtcNow.ToString("yyyyMMddHHmmss");

                var receipt = new PurchaseReceipt
                {
                    ReceiptCode = code,
                    SupplierId = dto.SupplierId,
                    ReceiptDate = DateTime.UtcNow,
                    TotalAmount = 0,
                    Status = dto.Status, // DRAFT or RECEIVED
                    CreatedByStaffId = createdByStaffId,
                    Note = dto.Note,
                    Items = new List<PurchaseReceiptItem>(),
                };

                decimal total = 0;

                foreach (var itemDto in dto.Items)
                {
                    var lineTotal = itemDto.Quantity * itemDto.UnitCost;
                    total += lineTotal;

                    receipt.Items.Add(
                        new PurchaseReceiptItem
                        {
                            IngredientId = itemDto.IngredientId,
                            Quantity = itemDto.Quantity,
                            UnitCost = itemDto.UnitCost,
                            // LineTotal is computed in DB, though we calculate it here for total
                        }
                    );
                }

                receipt.TotalAmount = total;

                _context.PurchaseReceipts.Add(receipt);
                await _context.SaveChangesAsync();

                // If created directly as RECEIVED, process stock movement immediately
                if (receipt.Status == "RECEIVED")
                {
                    await ProcessStockMovement(receipt.ReceiptId, createdByStaffId);
                }

                if (transaction != null)
                {
                    await transaction.CommitAsync();
                }

                return await GetByIdAsync(receipt.ReceiptId)
                    ?? throw new Exception("Failed to retrieve created receipt");
            }
            catch
            {
                if (transaction != null)
                {
                    await transaction.RollbackAsync();
                }
                throw;
            }
            finally
            {
                if (transaction != null)
                {
                    await transaction.DisposeAsync();
                }
            }
        }

        public async Task<bool> UpdateStatusAsync(long id, string status)
        {
            var receipt = await _context.PurchaseReceipts.FindAsync(id);
            if (receipt == null)
                return false;

            if (receipt.Status == "RECEIVED")
            {
                throw new InvalidOperationException(
                    "Cannot change status of an already received receipt."
                );
            }
            if (receipt.Status == "CANCELLED")
            {
                throw new InvalidOperationException("Cannot change status of a cancelled receipt.");
            }

            receipt.Status = status;

            if (status == "RECEIVED")
            {
                await ProcessStockMovement(receipt.ReceiptId, receipt.CreatedByStaffId);
            }

            await _context.SaveChangesAsync();
            return true;
        }

        private async Task ProcessStockMovement(long receiptId, long? staffId)
        {
            var items = await _context
                .PurchaseReceiptItems.Where(i => i.ReceiptId == receiptId)
                .ToListAsync();

            foreach (var item in items)
            {
                var stockMovement = new StockMovement
                {
                    IngredientId = item.IngredientId,
                    MovementType = "IN",
                    Quantity = item.Quantity,
                    RefType = "PURCHASE_RECEIPT",
                    RefId = receiptId,
                    MovedAt = DateTime.UtcNow,
                    CreatedByStaffId = staffId,
                    Note = $"Nhập kho từ phiếu {receiptId}",
                };

                _context.StockMovements.Add(stockMovement);
            }

            await _context.SaveChangesAsync();
        }
    }
}
