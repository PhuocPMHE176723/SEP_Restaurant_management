using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Services.Interface;

namespace SEP_Restaurant_management.Controllers;

[Route("api/[controller]")]
[Authorize(Roles = "Admin,Manager,Staff")]
public class AdminReservationController : BaseController
{
    private readonly IReservationService _reservationService;

    public AdminReservationController(IReservationService reservationService)
    {
        _reservationService = reservationService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllReservations()
    {
        try
        {
            var reservations = await _reservationService.GetAllReservationsAsync();
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
            var updated = await _reservationService.UpdateReservationStatusAsync(
                id,
                request.Status,
                request.TableId
            );
            if (!updated)
            {
                return Failure("Reservation or table not found or invalid status");
            }

            return Success("Reservation updated successfully");
        }
        catch (Exception ex)
        {
            return Failure(ex.Message);
        }
    }
}
