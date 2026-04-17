using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEP_Restaurant_management.Core.Services.Implementation;
using SEP_Restaurant_management.Core.DTOs;
using System.Threading.Tasks;
using System.Collections.Generic;
using rmn_be.Core.Services.Interface;

namespace SEP_Restaurant_management.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Kitchen,Admin,Staff,Cashier")]
public class KitchenController : BaseController
{
    private readonly KitchenService _kitchenService;
    private readonly IKitchen2Service _kitchen2Service;
    public KitchenController(KitchenService kitchenService, IKitchen2Service kitchen2Service)
    {
        _kitchenService = kitchenService;
        _kitchen2Service = kitchen2Service;
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

    [HttpGet("cooking-list")]
    public async Task<IActionResult> GetCookingList()
    {
        var result = await _kitchen2Service.GetCookingListAsync();
        return Success(result);
    }

    [HttpPost("cooking-list/{itemId}/start-cooking")]
    public async Task<IActionResult> StartCookingByItem(long itemId)
    {
        var result = await _kitchen2Service.StartCookingByItemAsync(itemId);
        if (!result) return NotFoundResponse("Không tìm thấy món phù hợp để chuyển sang đang nấu");
        return Success("Đã chuyển món sang trạng thái đang nấu");
    }

    [HttpPost("cooking-list/{itemId}/mark-ready")]
    public async Task<IActionResult> MarkReadyByItem(long itemId)
    {
        var result = await _kitchen2Service.MarkReadyServeByItemAsync(itemId);
        if (!result) return NotFoundResponse("Không tìm thấy món phù hợp để chuyển sang sẵn sàng phục vụ");
        return Success("Đã chuyển món sang trạng thái sẵn sàng phục vụ");
    }
}
