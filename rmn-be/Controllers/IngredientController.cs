using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Services.Interface;
using System.Linq;
using System.Threading.Tasks;

namespace SEP_Restaurant_management.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class IngredientController : BaseController
    {
        private readonly IIngredientService _ingredientService;
        private readonly SepDatabaseContext _context;

        public IngredientController(IIngredientService ingredientService, SepDatabaseContext context)
        {
            _ingredientService = ingredientService;
            _context = context;
        }

        [Authorize(Roles = "Staff,Manager,Admin,Kitchen,Warehouse,Cashier")]
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var ingredients = await _ingredientService.GetAllAsync();
            return Success(ingredients);
        }

        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetById(long id)
        {
            var ingredient = await _ingredientService.GetByIdAsync(id);
            if (ingredient == null) return NotFoundResponse($"Ingredient with ID {id} not found.");
            return Success(ingredient);
        }

        [Authorize(Roles = "Admin,Warehouse")]
        [HttpGet("{id:long}/price-history")]
        public async Task<IActionResult> GetPriceHistory(long id)
        {
            var batches = await _context.PurchaseReceiptItems
                .Where(i => i.IngredientId == id && i.Receipt.Status == "RECEIVED")
                .Include(i => i.Receipt)
                .OrderByDescending(i => i.Receipt.ReceiptDate)
                .Select(i => new
                {
                    Date = i.Receipt.ReceiptDate,
                    ReceiptCode = i.Receipt.ReceiptCode,
                    Quantity = i.Quantity,
                    UnitCost = i.UnitCost
                })
                .ToListAsync();

            var averagePrice = batches.Any() ? batches.Average(b => (double)b.UnitCost) : 0;

            return Success(new { Batches = batches, AveragePrice = Math.Round(averagePrice, 0) });
        }

        [Authorize(Roles = "Admin,Warehouse")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateIngredientRequest dto)
        {
            if (!ModelState.IsValid) return Failure("Invalid data");
            try 
            {
                var created = await _ingredientService.CreateAsync(dto);
                return Success(created, "Ingredient created successfully");
            }
            catch (System.InvalidOperationException ex)
            {
                return Failure(ex.Message);
            }
        }

        [Authorize(Roles = "Admin,Warehouse")]
        [HttpPut("{id:long}")]
        public async Task<IActionResult> Update(long id, [FromBody] UpdateIngredientRequest dto)
        {
            if (!ModelState.IsValid) return Failure("Invalid data");
            try
            {
                var updated = await _ingredientService.UpdateAsync(id, dto);
                if (!updated) return NotFoundResponse($"Ingredient with ID {id} not found.");
                return Success("Ingredient updated successfully");
            }
            catch (System.InvalidOperationException ex)
            {
                return Failure(ex.Message);
            }
        }

        [Authorize(Roles = "Admin,Warehouse")]
        [HttpDelete("{id:long}")]
        public async Task<IActionResult> Delete(long id)
        {
            var deleted = await _ingredientService.DeleteAsync(id);
            if (!deleted) return NotFoundResponse($"Ingredient with ID {id} not found.");
            return Success("Ingredient deactivated successfully");
        }
    }
}
