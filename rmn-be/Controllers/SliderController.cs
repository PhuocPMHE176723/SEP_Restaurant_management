using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using AutoMapper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Models;

namespace SEP_Restaurant_management.Controllers;

[Route("api/[controller]")]
[Authorize(Roles = "Admin,Manager,Staff")]
public class SliderController : BaseController
{
    private readonly SepDatabaseContext _context;
    private readonly IMapper _mapper;

    public SliderController(SepDatabaseContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        var sliders = await _context.Sliders
            .Where(s => s.IsActive)
            .OrderBy(s => s.DisplayOrder)
            .ToListAsync();
            
        return Success(_mapper.Map<List<SliderDTO>>(sliders));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateSliderDTO dto)
    {
        var slider = _mapper.Map<Slider>(dto);
        slider.CreatedAt = DateTime.UtcNow;
        slider.IsActive = true;
        
        _context.Sliders.Add(slider);
        await _context.SaveChangesAsync();
        
        return Success(_mapper.Map<SliderDTO>(slider), "Slider created successfully");
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateSliderDTO dto)
    {
        var slider = await _context.Sliders.FindAsync(id);
        if (slider == null) return NotFoundResponse("Slider not found");
        
        _mapper.Map(dto, slider);
        await _context.SaveChangesAsync();
        
        return Success("Slider updated successfully");
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var slider = await _context.Sliders.FindAsync(id);
        if (slider == null) return NotFoundResponse("Slider not found");
        
        _context.Sliders.Remove(slider);
        await _context.SaveChangesAsync();
        
        return Success("Slider deleted successfully");
    }
}
