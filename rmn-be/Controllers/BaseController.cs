using Microsoft.AspNetCore.Mvc;
using SEP_Restaurant_management.Core.Exceptions;

namespace SEP_Restaurant_management.Controllers;

[ApiController]
public abstract class BaseController : ControllerBase
{
    protected IActionResult Success<T>(T data, string message = "Success")
    {
        return Ok(ApiResponse<T>.SuccessResponse(data, message));
    }

    protected IActionResult Success(string message = "Success")
    {
        return Ok(ApiMessage.SuccessResponse(message));
    }

    protected IActionResult Failure(string message, List<string>? errors = null)
    {
        return BadRequest(ApiResponse<object>.FailureResponse(message, errors));
    }

    protected IActionResult NotFoundResponse(string message = "Resource not found")
    {
        return NotFound(ApiMessage.FailureResponse(message));
    }
}
