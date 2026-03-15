using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Services.Interface;

namespace SEP_Restaurant_management.Controllers;

[Route("api/[controller]")]
[ApiController]
public class DiningTableController : BaseController
{
    private readonly IDiningTableService _tableService;

    public DiningTableController(IDiningTableService tableService)
    {
        _tableService = tableService;
    }

    
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var tables = await _tableService.GetAllAsync();
        return Success(tables);
    }

    
    [HttpGet("with-orders")]
    [Authorize(Roles = "Staff,Manager,Admin,Receptionist")]
    public async Task<IActionResult> GetAllWithOrders()
    {
        var tables = await _tableService.GetAllWithOrdersAsync();
        return Success(tables);
    }

 
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var table = await _tableService.GetByIdAsync(id);
        if (table == null)
            return NotFoundResponse($"Table with ID {id} not found");
        return Success(table);
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDiningTableDTO dto)
    {
        try
        {
            var created = await _tableService.CreateAsync(dto);
            return Success(created, "Table created successfully");
        }
        catch (InvalidOperationException ex)
        {
            return Failure(ex.Message);
        }
    }

    [Authorize(Roles = "Admin,Manager")]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateDiningTableDTO dto)
    {
        try
        {
            var updated = await _tableService.UpdateAsync(id, dto);
            if (!updated)
                return NotFoundResponse($"Table with ID {id} not found");
            return Success("Table updated successfully");
        }
        catch (InvalidOperationException ex)
        {
            return Failure(ex.Message);
        }
    }

 
    [Authorize(Roles = "Admin,Manager")]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await _tableService.DeleteAsync(id);
        if (!deleted)
            return NotFoundResponse($"Table with ID {id} not found");
        return Success("Table deactivated successfully");
    }
}
