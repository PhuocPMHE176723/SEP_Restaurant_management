using SEP_Restaurant_management.Core.DTOs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace SEP_Restaurant_management.Core.Services.Interface
{
    public interface IIngredientService
    {
        Task<IEnumerable<IngredientResponse>> GetAllAsync();
        Task<IngredientResponse?> GetByIdAsync(long id);
        Task<IngredientResponse> CreateAsync(CreateIngredientRequest dto);
        Task<bool> UpdateAsync(long id, UpdateIngredientRequest dto);
        Task<bool> DeleteAsync(long id);
    }
}
