using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Services.Interface;

namespace SEP_Restaurant_management.Controllers;

[Route("api/[controller]")]
[Authorize(Roles = "Admin,Manager,Staff,Cashier")]
public class AdminReservationController : BaseController
{
    private readonly IReservationService _reservationService;

    public AdminReservationController(IReservationService reservationService)
    {
        _reservationService = reservationService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllReservations(
        [FromQuery] DateTime? startDate = null,
        [FromQuery] DateTime? endDate = null
    )
    {
        try
        {
            var reservations = await _reservationService.GetAllReservationsAsync(
                startDate,
                endDate
            );
            return Success(reservations);
        }
        catch (Exception ex)
        {
            return Failure(ex.Message);
        }
    }

    [HttpPatch("{id}/status")]
    public async Task<IActionResult> UpdateStatus(
        long id,
        [FromBody] UpdateReservationStatusRequest request
    )
    {
        try
        {
            var orderId = await _reservationService.UpdateReservationStatusAsync(
                id,
                request.Status,
                request.TableIds
            );
            if (orderId == null)
            {
                return Failure("Reservation or table not found or invalid status");
            }

            return Success(
                new { orderId = orderId > 0 ? orderId : null },
                "Reservation updated successfully"
            );
        }
        catch (Exception ex)
        {
            return Failure(ex.Message);
        }
    }
}
