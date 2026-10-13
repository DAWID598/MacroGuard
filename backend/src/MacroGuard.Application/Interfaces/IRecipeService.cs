using MacroGuard.Application.DTOs;

namespace MacroGuard.Application.Interfaces;

public interface IRecipeService
{
    Task<GeneratedRecipeDto> GenerateRecipeAsync(GenerateRecipeRequest request, CancellationToken ct = default);
    Task<List<MealEntryDto>> ApplyRecipeToDiaryAsync(Guid userId, ApplyRecipeRequest request, CancellationToken ct = default);
    AiInfoDto GetAiInfo();
}

