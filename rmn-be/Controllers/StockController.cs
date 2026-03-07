using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Services.Interface;
using System;
using System.Threading.Tasks;

namespace SEP_Restaurant_management.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StockController : BaseController
    {
        private readonly IStockService _stockService;

        public StockController(IStockService stockService)
        {
            _stockService = stockService;
        }

        [Authorize(Roles = "Admin,Warehouse")]
        [HttpGet("inventory")]
        public async Task<IActionResult> GetInventoryOnHand()
        {
            var inventory = await _stockService.GetInventoryOnHandAsync();
            return Success(inventory);
        }

        [Authorize(Roles = "Admin,Warehouse")]
        [HttpGet("low-stock")]
        public async Task<IActionResult> GetLowStock([FromQuery] decimal threshold = 10)
        {
            var lowStock = await _stockService.GetLowStockAsync(threshold);
            return Success(lowStock);
        }

        [Authorize(Roles = "Admin,Warehouse")]
        [HttpGet("movements")]
        public async Task<IActionResult> GetMovements()
        {
            var movements = await _stockService.GetMovementsAsync();
            return Success(movements);
        }

        [Authorize(Roles = "Admin,Warehouse")]
        [HttpPost("adjust")]
        public async Task<IActionResult> AdjustStock([FromBody] ManualAdjustmentRequest dto)
        {
            if (!ModelState.IsValid) return Failure("Invalid data");

            long? staffId = null;
            var staffIdClaim = User.FindFirst("staffId")?.Value;
            if (!string.IsNullOrEmpty(staffIdClaim) && long.TryParse(staffIdClaim, out long parsedStaff))
                staffId = parsedStaff;

            try
            {
                var movement = await _stockService.CreateManualAdjustmentAsync(dto, staffId);
                return Success(movement, "Stock adjustment created successfully");
            }
            catch (Exception ex)
            {
                return Failure(ex.Message);
            }
        }
    }
}
