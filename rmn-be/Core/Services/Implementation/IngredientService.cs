using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using SEP_Restaurant_management.Core.DTOs;
using SEP_Restaurant_management.Core.Models;
using SEP_Restaurant_management.Core.Services.Interface;

namespace SEP_Restaurant_management.Core.Services.Implementation
{
    public class IngredientService : IIngredientService
    {
        private readonly SepDatabaseContext _context;

        public IngredientService(SepDatabaseContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<IngredientResponse>> GetAllAsync()
        {
            return await _context
                .Ingredients.Select(i => new IngredientResponse
                {
                    IngredientId = i.IngredientId,
                    IngredientName = i.IngredientName,
                    Unit = i.Unit,
                    IsActive = i.IsActive,
                })
                .ToListAsync();
        }

        public async Task<IngredientResponse?> GetByIdAsync(long id)
        {
            var i = await _context.Ingredients.FindAsync(id);
            if (i == null)
                return null;

            return new IngredientResponse
            {
                IngredientId = i.IngredientId,
                IngredientName = i.IngredientName,
                Unit = i.Unit,
                IsActive = i.IsActive,
            };
        }

        public async Task<IngredientResponse> CreateAsync(CreateIngredientRequest dto)
        {
            var normalizedName = NormalizeName(dto.IngredientName);
            if (string.IsNullOrWhiteSpace(normalizedName))
                throw new InvalidOperationException("Tên nguyên liệu không được để trống.");

            var exists = await _context.Ingredients.AnyAsync(i =>
                i.IngredientName.Trim().ToLower() == normalizedName.ToLower()
            );
            if (exists)
                throw new InvalidOperationException($"Nguyên liệu '{normalizedName}' đã tồn tại.");

            var ingredient = new Ingredient
            {
                IngredientName = normalizedName,
                Unit = dto.Unit,
                IsActive = true,
            };

            _context.Ingredients.Add(ingredient);
            await _context.SaveChangesAsync();

            return new IngredientResponse
            {
                IngredientId = ingredient.IngredientId,
                IngredientName = ingredient.IngredientName,
                Unit = ingredient.Unit,
                IsActive = ingredient.IsActive,
            };
        }

        public async Task<bool> UpdateAsync(long id, UpdateIngredientRequest dto)
        {
            var ingredient = await _context.Ingredients.FindAsync(id);
            if (ingredient == null)
                return false;

            if (
                !string.IsNullOrEmpty(dto.IngredientName)
                && dto.IngredientName != ingredient.IngredientName
            )
            {
                var normalizedName = NormalizeName(dto.IngredientName);
                if (string.IsNullOrWhiteSpace(normalizedName))
                    throw new InvalidOperationException("Tên nguyên liệu không được để trống.");

                var exists = await _context.Ingredients.AnyAsync(i =>
                    i.IngredientId != id
                    && i.IngredientName.Trim().ToLower() == normalizedName.ToLower()
                );
                if (exists)
                    throw new InvalidOperationException(
                        $"Nguyên liệu '{normalizedName}' đã tồn tại."
                    );

                ingredient.IngredientName = normalizedName;
            }

            if (!string.IsNullOrEmpty(dto.Unit))
                ingredient.Unit = dto.Unit;

            if (dto.IsActive.HasValue)
                ingredient.IsActive = dto.IsActive.Value;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteAsync(long id)
        {
            var ingredient = await _context.Ingredients.FindAsync(id);
            if (ingredient == null)
                return false;

            // Soft delete
            ingredient.IsActive = false;
            await _context.SaveChangesAsync();
            return true;
        }

        private static string NormalizeName(string name) => name.Trim();
    }
}
