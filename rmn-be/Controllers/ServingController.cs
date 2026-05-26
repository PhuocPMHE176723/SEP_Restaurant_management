using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using rmn_be.Core.DTOs;
using rmn_be.Core.Services.Interface;
using SEP_Restaurant_management.Controllers;

namespace rmn_be.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,Staff")]
    public class ServingController : BaseController
    {
        private readonly IServingService _servingService;

        public ServingController(IServingService servingService)
        {
            _servingService = servingService;
        }

        [HttpGet("serving-list")]
        public async Task<IActionResult> GetServingList()
        {
            var result = await _servingService.GetServingListAsync();
            return Success(result);
        }

        [HttpGet("serving-list/{itemId}/tables")]
        public async Task<IActionResult> GetServingTables(long itemId)
        {
            var result = await _servingService.GetServingTablesAsync(itemId);
            return Success(result);
        }

        [HttpPost("serving-list/{itemId}/serve")]
        public async Task<IActionResult> ServeReadyItem(long itemId, [FromBody] ServeReadyItemRequestDTO request)
        {
            var result = await _servingService.ServeReadyItemAsync(itemId, request.OrderId, request.Quantity);
            if (!result) return NotFoundResponse("Không thể xác nhận bế món");
            return Success("Đã xác nhận bế món");
        }

        [HttpPost("serving-list/{itemId}/reassign")]
        public async Task<IActionResult> ReassignReadyItem(long itemId, [FromBody] ReassignReadyItemRequestDTO request)
        {
            var result = await _servingService.ReassignReadyItemAsync(
                itemId,
                request.FromOrderId,
                request.ToOrderId,
                request.Quantity);

            if (!result) return NotFoundResponse("Không thể chuyển món sang bàn khác");
            return Success("Đã chuyển món sang bàn khác");
        }
    }
}
