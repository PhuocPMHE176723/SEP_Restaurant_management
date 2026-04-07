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
public class BlogController : BaseController
{
    private readonly SepDatabaseContext _context;
    private readonly IMapper _mapper;

    public BlogController(SepDatabaseContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        var posts = await _context.BlogPosts
            .Include(p => p.Category)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
        
        return Success(_mapper.Map<List<BlogPostDTO>>(posts));
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(int id)
    {
        var post = await _context.BlogPosts
            .Include(p => p.Category)
            .FirstOrDefaultAsync(p => p.PostId == id);
            
        if (post == null) return NotFoundResponse("Blog post not found");
        return Success(_mapper.Map<BlogPostDTO>(post));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateBlogPostDTO dto)
    {
        var post = _mapper.Map<BlogPost>(dto);
        post.CreatedAt = DateTime.UtcNow;
        
        _context.BlogPosts.Add(post);
        await _context.SaveChangesAsync();
        
        return Success(_mapper.Map<BlogPostDTO>(post), "Blog post created successfully");
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] CreateBlogPostDTO dto)
    {
        var post = await _context.BlogPosts.FindAsync(id);
        if (post == null) return NotFoundResponse("Blog post not found");
        
        _mapper.Map(dto, post);
        await _context.SaveChangesAsync();
        
        return Success("Blog post updated successfully");
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var post = await _context.BlogPosts.FindAsync(id);
        if (post == null) return NotFoundResponse("Blog post not found");
        
        _context.BlogPosts.Remove(post);
        await _context.SaveChangesAsync();
        
        return Success("Blog post deleted successfully");
    }

    [HttpGet("categories")]
    [AllowAnonymous]
    public async Task<IActionResult> GetCategories()
    {
        var categories = await _context.BlogCategories.ToListAsync();
        return Success(_mapper.Map<List<BlogCategoryDTO>>(categories));
    }

    [HttpPost("categories")]
    public async Task<IActionResult> CreateCategory([FromBody] BlogCategoryDTO dto)
    {
        var category = _mapper.Map<BlogCategory>(dto);
        _context.BlogCategories.Add(category);
        await _context.SaveChangesAsync();
        return Success(_mapper.Map<BlogCategoryDTO>(category), "Category created successfully");
    }

    [HttpPut("categories/{id}")]
    public async Task<IActionResult> UpdateCategory(int id, [FromBody] BlogCategoryDTO dto)
    {
        var category = await _context.BlogCategories.FindAsync(id);
        if (category == null) return NotFoundResponse("Category not found");
        
        _mapper.Map(dto, category);
        await _context.SaveChangesAsync();
        return Success("Category updated successfully");
    }

    [HttpDelete("categories/{id}")]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        var category = await _context.BlogCategories.FindAsync(id);
        if (category == null) return NotFoundResponse("Category not found");
        
        // Check if category has posts
        var hasPosts = await _context.BlogPosts.AnyAsync(p => p.CategoryId == id);
        if (hasPosts) return Failure("Cannot delete category with existing blog posts");

        _context.BlogCategories.Remove(category);
        await _context.SaveChangesAsync();
        return Success("Category deleted successfully");
    }
}
