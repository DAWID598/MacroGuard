using MacroGuard.Application.DTOs;

namespace MacroGuard.Application.Interfaces;

public interface ICustomMealSetService
{
    Task<List<CustomMealSetDto>> GetUserMealSetsAsync(Guid userId, CancellationToken ct = default);
    Task<CustomMealSetDto> CreateFromMealAsync(Guid userId, CreateMealSetFromMealRequest request, CancellationToken ct = default);
    Task<List<MealEntryDto>> ApplyMealSetAsync(Guid userId, Guid mealSetId, ApplyMealSetRequest request, CancellationToken ct = default);
    Task<bool> DeleteMealSetAsync(Guid userId, Guid mealSetId, CancellationToken ct = default);
}

