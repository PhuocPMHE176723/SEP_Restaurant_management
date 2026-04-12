using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEP_Restaurant_management.Core.Data;
using SEP_Restaurant_management.Core.Middlewares;
using SEP_Restaurant_management.Core.Models;

namespace SEP_Restaurant_management.Controllers;

[Route("api/[controller]")]
[ApiController]
public class DailyEstimationController : BaseController
{
    private readonly SepDatabaseContext _context;

    public DailyEstimationController(SepDatabaseContext context)
    {
        _context = context;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Manager,Kitchen,Warehouse")]
    public async Task<IActionResult> GetDailyAllocations([FromQuery] DateTime? date)
    {
        var targetDate = date?.Date ?? DateTimeHelper.VietnamNow().Date;

        var allocations = await _context.DailyIngredientAllocations
            .Include(a => a.Ingredient)
            .Where(a => a.Date == targetDate)
            .ToListAsync();

        // Auto-seed if empty for today
        if (!allocations.Any() && targetDate == DateTimeHelper.VietnamNow().Date)
        {
            await SeedDailyAllocations(targetDate);
            allocations = await _context.DailyIngredientAllocations
                .Include(a => a.Ingredient)
                .Where(a => a.Date == targetDate)
                .ToListAsync();
        }

        var result = allocations.Select(a => new
        {
            a.Id,
            a.IngredientId,
            IngredientName = a.Ingredient != null ? a.Ingredient.IngredientName : "N/A",
            Unit = a.Ingredient != null ? a.Ingredient.Unit : "N/A",
            a.AllocatedQuantity,
            a.ActuallyUsedQuantity,
            a.AdjustedQuantity,
            a.Note,
            Status = a.ActuallyUsedQuantity > a.AllocatedQuantity ? "OVER_LIMIT" : "OK"
        });

        return Success(result);
    }

    private async Task SeedDailyAllocations(DateTime today)
    {
        var ingredients = await _context.Ingredients.Where(i => i.IsActive).ToListAsync();
        if (!ingredients.Any()) return;

        var seedData = new List<DailyIngredientAllocation>
        {
            new DailyIngredientAllocation
            {
                Date = today,
                IngredientId = ingredients.FirstOrDefault(i => i.IngredientName.Contains("Beef"))?.IngredientId ?? ingredients[0].IngredientId,
                AllocatedQuantity = 10,
                ActuallyUsedQuantity = 11.5m,
                Note = "Dự kiến 10kg cho ngày cuối tuần nhưng khách đông vượt mức"
            },
            new DailyIngredientAllocation
            {
                Date = today,
                IngredientId = ingredients.FirstOrDefault(i => i.IngredientName.Contains("Salmon"))?.IngredientId ?? (ingredients.Count > 1 ? ingredients[1].IngredientId : ingredients[0].IngredientId),
                AllocatedQuantity = 5,
                ActuallyUsedQuantity = 3.2m,
                Note = "Bếp chuẩn bị sẵn 5kg phi lê"
            },
            new DailyIngredientAllocation
            {
                Date = today,
                IngredientId = ingredients.FirstOrDefault(i => i.IngredientName.Contains("Onion"))?.IngredientId ?? (ingredients.Count > 2 ? ingredients[2].IngredientId : ingredients[0].IngredientId),
                AllocatedQuantity = 8,
                ActuallyUsedQuantity = 9.8m,
                Note = "Hao hụt do hành bị héo nhiều"
            },
            new DailyIngredientAllocation
            {
                Date = today,
                IngredientId = ingredients.FirstOrDefault(i => i.IngredientName.Contains("Rice"))?.IngredientId ?? (ingredients.Count > 3 ? ingredients[3].IngredientId : ingredients[0].IngredientId),
                AllocatedQuantity = 15,
                ActuallyUsedQuantity = 12,
                Note = "Nấu dư 3kg gạo dự phòng"
            }
        };

        _context.DailyIngredientAllocations.AddRange(seedData);
        await _context.SaveChangesAsync();
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Manager,Warehouse")]
    public async Task<IActionResult> UpsertAllocation([FromBody] UpsertDailyAllocationRequest request)
    {
        var targetDate = request.Date?.Date ?? DateTimeHelper.VietnamNow().Date;

        var allocation = await _context.DailyIngredientAllocations
            .FirstOrDefaultAsync(a => a.IngredientId == request.IngredientId && a.Date == targetDate);

        if (allocation == null)
        {
            allocation = new DailyIngredientAllocation
            {
                Date = targetDate,
                IngredientId = request.IngredientId,
                AllocatedQuantity = request.AllocatedQuantity,
                Note = request.Note,
                ActuallyUsedQuantity = 0
            };
            _context.DailyIngredientAllocations.Add(allocation);
        }
        else
        {
            allocation.AllocatedQuantity = request.AllocatedQuantity;
            allocation.Note = request.Note;
        }

        await _context.SaveChangesAsync();
        return Success(allocation, "Daily allocation updated successfully");
    }

    [HttpPost("batch")]
    [Authorize(Roles = "Admin,Manager,Warehouse")]
    public async Task<IActionResult> BatchUpsertAllocations([FromBody] List<UpsertDailyAllocationRequest> requests)
    {
        if (requests == null || !requests.Any()) return Failure("No data provided");

        foreach (var req in requests)
        {
            var targetDate = req.Date?.Date ?? DateTimeHelper.VietnamNow().Date;
            var allocation = await _context.DailyIngredientAllocations
                .FirstOrDefaultAsync(a => a.IngredientId == req.IngredientId && a.Date == targetDate);

            if (allocation == null)
            {
                _context.DailyIngredientAllocations.Add(new DailyIngredientAllocation
                {
                    Date = targetDate,
                    IngredientId = req.IngredientId,
                    AllocatedQuantity = req.AllocatedQuantity,
                    Note = req.Note
                });
            }
            else
            {
                allocation.AllocatedQuantity = req.AllocatedQuantity;
                allocation.Note = req.Note;
            }
        }

        await _context.SaveChangesAsync();
        return Success("Batch update successful");
    }

    [HttpPut("{id}/adjust")]
    [Authorize(Roles = "Admin,Manager,Kitchen,Warehouse")]
    public async Task<IActionResult> AdjustQuantity(long id, [FromBody] decimal adjustment, [FromQuery] string? note)
    {
        var allocation = await _context.DailyIngredientAllocations.FindAsync(id);
        if (allocation == null) return NotFoundResponse("Allocation not found");

        allocation.AdjustedQuantity += adjustment;
        if (!string.IsNullOrEmpty(note))
        {
            allocation.Note = (allocation.Note + " | Adjustment: " + note).Trim(' ', '|');
        }

        await _context.SaveChangesAsync();
        return Success(allocation, "Adjustment recorded");
    }
}

public class UpsertDailyAllocationRequest
{
    public DateTime? Date { get; set; }
    public long IngredientId { get; set; }
    public decimal AllocatedQuantity { get; set; }
    public string? Note { get; set; }
}
