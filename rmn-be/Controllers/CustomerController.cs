using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEP_Restaurant_management.Core.Data;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.DTOs;

namespace SEP_Restaurant_management.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CustomerController : BaseController
{
    private readonly SepDatabaseContext _context;

    public CustomerController(SepDatabaseContext context)
    {
        _context = context;
    }

    [HttpGet("lookup")]
    [Authorize(Roles = "Receptionist,Staff,Manager,Admin")]
    public async Task<IActionResult> LookupByPhone([FromQuery] string phone)
    {
        var customer = await _context.Customers
            .Include(c => c.Reservations)
            .FirstOrDefaultAsync(c => c.Phone == phone);

        if (customer == null) return NotFoundResponse("Customer not found");

        return Success(new {
            customer.CustomerId,
            customer.FullName,
            customer.Phone,
            customer.TotalPoints,
            customer.Email
        });
    }

    [HttpPost]
    [Authorize(Roles = "Receptionist,Staff,Manager,Admin")]
    public async Task<IActionResult> CreateCustomer([FromBody] CreateCustomerRequest request)
    {
        if (await _context.Customers.AnyAsync(c => c.Phone == request.Phone))
            return Failure("Số điện thoại này đã được đăng ký.");

        var customer = new Customer
        {
            FullName = request.FullName,
            Phone = request.Phone,
            Email = request.Email,
            CreatedAt = DateTime.UtcNow,
            TotalPoints = 0
        };

        _context.Customers.Add(customer);
        await _context.SaveChangesAsync();

        return Success(customer, "Tạo khách hàng thành công");
    }
}

public class CreateCustomerRequest
{
    public string FullName { get; set; } = default!;
    public string Phone { get; set; } = default!;
    public string? Email { get; set; }
}
