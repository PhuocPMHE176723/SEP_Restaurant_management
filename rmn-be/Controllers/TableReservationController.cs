using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using rmn_be.Core.DTOs;
using rmn_be.Core.Services.Interface;
using SEP_Restaurant_management.Controllers;

namespace rmn_be.Controllers
{
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin,Manager,Staff,Cashier")]
    public class TableReservationController : BaseController
    {
        private readonly ITableService _tableService;
        public TableReservationController(ITableService tableService)
        {
            _tableService = tableService;
        }
        [HttpGet("{id}/assignable-tables")]
        public async Task<IActionResult> GetAssignableTables(long id)
        {
            try
            {
                var result = await _tableService.GetAssignableTablesAsync(id);
                return Ok(new
                {
                    success = true,
                    message = "Lấy danh sách bàn thành công",
                    data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }

        [HttpPut("{id}/assign-tables")]
        public async Task<IActionResult> AssignTables(
            long id,
            [FromBody] AssignTablesRequestDTO request)
        {
            try
            {
                var result = await _tableService.AssignTablesAsync(id, request);

                return Ok(new
                {
                    success = true,
                    message = "Gán bàn thành công",
                    data = result
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }
        [HttpPut("{id}/check-in")]
        public async Task<IActionResult> CheckInReservation(long id)
        {
            try
            {
                var orderId = await _tableService.CheckInReservationAsync(id);

                return Ok(new
                {
                    success = true,
                    message = "Check-in thành công",
                    data = new
                    {
                        orderId
                    }
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    success = false,
                    message = ex.Message
                });
            }
        }
    }
}
