using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEP_Restaurant_management.Core.Services.Implementation;
using SEP_Restaurant_management.Core.DTOs;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace SEP_Restaurant_management.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Kitchen,Admin,Staff,Cashier")]
public class KitchenController : BaseController
{
    private readonly KitchenService _kitchenService;

    public KitchenController(KitchenService kitchenService)
    {
        _kitchenService = kitchenService;
    }

    [HttpGet("queue")]
    public async Task<IActionResult> GetQueue()
    {
        var items = await _kitchenService.GetKitchenQueueAsync();
        return Success(items);
    }

    [HttpPost("item/{id}/serve")]
    public async Task<IActionResult> ServeItem(long id)
    {
        var result = await _kitchenService.UpdateItemStatusAsync(id, "SERVED");
        if (!result) return NotFoundResponse("Item not found");
        return Success("Món ăn đã được phục vụ");
    }

    [HttpPost("item/{id}/start")]
    public async Task<IActionResult> StartCooking(long id)
    {
        var result = await _kitchenService.UpdateItemStatusAsync(id, "COOKING");
        if (!result) return NotFoundResponse("Item not found");
        return Success("Bắt đầu chế biến");
    }
}
