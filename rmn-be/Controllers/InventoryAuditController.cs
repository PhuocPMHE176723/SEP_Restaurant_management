using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEP_Restaurant_management.Core.Data;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Middlewares;
using System.Security.Claims;

namespace SEP_Restaurant_management.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Manager,Admin,Staff")]
public class InventoryAuditController : BaseController
{
    private readonly SepDatabaseContext _context;

    public InventoryAuditController(SepDatabaseContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllAudits()
    {
        var audits = await _context.InventoryAudits
            .Include(a => a.Staff)
            .OrderByDescending(a => a.AuditDate)
            .Select(a => new
            {
                a.AuditId,
                a.AuditCode,
                a.AuditDate,
                StaffName = a.Staff.FullName,
                a.Note,
                ItemCount = a.AuditItems.Count
            })
            .ToListAsync();

        return Success(audits);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetAudit(long id)
    {
        var audit = await _context.InventoryAudits
            .Include(a => a.Staff)
            .Include(a => a.AuditItems)
                .ThenInclude(ai => ai.Ingredient)
            .FirstOrDefaultAsync(a => a.AuditId == id);

        if (audit == null) return NotFoundResponse("Audit not found");

        return Success(audit);
    }

    [HttpPost]
    public async Task<IActionResult> CreateAudit([FromBody] CreateAuditRequest request)
    {
        using var transaction = await _context.Database.BeginTransactionAsync();
        try
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var staff = await _context.Staffs.FirstOrDefaultAsync(s => s.UserId == userId);
            if (staff == null) return Failure("Staff not found");

            var auditCode = $"AUDIT-{DateTimeHelper.VietnamNow():yyyyMMdd}-{Guid.NewGuid().ToString("N").Substring(0, 4).ToUpper()}";
            
            var audit = new InventoryAudit
            {
                AuditCode = auditCode,
                AuditDate = DateTimeHelper.VietnamNow(),
                StaffId = staff.StaffId,
                Note = request.Note
            };

            _context.InventoryAudits.Add(audit);
            await _context.SaveChangesAsync();

            foreach (var item in request.Items)
            {
                // Tính toán tồn hệ thống hiện tại cho nguyên liệu này
                var systemQty = await _context.StockMovements
                    .Where(m => m.IngredientId == item.IngredientId)
                    .SumAsync(m => m.MovementType == "IN" ? m.Quantity : -m.Quantity);

                var auditItem = new InventoryAuditItem
                {
                    AuditId = audit.AuditId,
                    IngredientId = item.IngredientId,
                    SystemQuantity = systemQty,
                    ActualQuantity = item.ActualQuantity,
                    Difference = item.ActualQuantity - systemQty
                };

                _context.InventoryAuditItems.Add(auditItem);

                // Nếu có chênh lệch, tạo bản ghi StockMovement để cân bằng kho
                if (auditItem.Difference != 0)
                {
                    var adjustment = new StockMovement
                    {
                        IngredientId = item.IngredientId,
                        MovementType = auditItem.Difference > 0 ? "IN" : "OUT",
                        Quantity = Math.Abs(auditItem.Difference),
                        RefType = "AUDIT",
                        RefId = audit.AuditId,
                        MovedAt = DateTimeHelper.VietnamNow(),
                        CreatedByStaffId = staff.StaffId,
                        Note = $"Điều chỉnh kho sau kiểm kê {auditCode}. Lý do: {request.Note}"
                    };
                    _context.StockMovements.Add(adjustment);
                }
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            return Success(new { audit.AuditId, audit.AuditCode }, "Inventory audit completed and stock adjusted.");
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync();
            return Failure($"Failed to create audit: {ex.Message}");
        }
    }
}

public class CreateAuditRequest
{
    public string? Note { get; set; }
    public List<AuditItemInput> Items { get; set; } = new();
}

public class AuditItemInput
{
    public long IngredientId { get; set; }
    public decimal ActualQuantity { get; set; }
}
