using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Services.Interface;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace SEP_Restaurant_management.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PurchaseReceiptController : BaseController
    {
        private readonly IPurchaseReceiptService _receiptService;

        public PurchaseReceiptController(IPurchaseReceiptService receiptService)
        {
            _receiptService = receiptService;
        }

        [Authorize(Roles = "Admin,Warehouse")]
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var receipts = await _receiptService.GetAllAsync();
            return Success(receipts);
        }

        [Authorize(Roles = "Admin,Warehouse")]
        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetById(long id)
        {
            var receipt = await _receiptService.GetByIdAsync(id);
            if (receipt == null) return NotFoundResponse($"Receipt with ID {id} not found.");
            return Success(receipt);
        }

        [Authorize(Roles = "Admin,Warehouse")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreatePurchaseReceiptRequest dto)
        {
            if (!ModelState.IsValid) return Failure("Invalid data");

            // Extract staff ID from claims (optional)
            long? staffId = null;
            var staffIdClaim = User.FindFirst("staffId")?.Value;
            if (!string.IsNullOrEmpty(staffIdClaim) && long.TryParse(staffIdClaim, out long parsedStaff))
                staffId = parsedStaff;

            try
            {
                var created = await _receiptService.CreateAsync(dto, staffId);
                return Success(created, "Purchase receipt created successfully");
            }
            catch (Exception ex)
            {
                return Failure(ex.Message);
            }
        }

        [Authorize(Roles = "Admin,Warehouse")]
        [HttpPut("{id:long}/status")]
        public async Task<IActionResult> UpdateStatus(long id, [FromBody] UpdateReceiptStatusRequest dto)
        {
            if (!ModelState.IsValid) return Failure("Invalid data");

            try
            {
                var updated = await _receiptService.UpdateStatusAsync(id, dto.Status);
                if (!updated) return NotFoundResponse($"Receipt with ID {id} not found.");
                return Success("Receipt status updated successfully");
            }
            catch (Exception ex)
            {
                return Failure(ex.Message);
            }
        }
    }
}
