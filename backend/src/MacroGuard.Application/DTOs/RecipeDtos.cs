using System.ComponentModel.DataAnnotations;
using MacroGuard.Domain.Enums;

namespace MacroGuard.Application.DTOs;

public record GenerateRecipeRequest(
    [Required] MealType MealType,
    [Range(100, 3000)] int TargetCalories,
    string? Preference = null
);

public record RecipeIngredientDto(
    string Name,
    decimal WeightGrams,
    decimal CaloriesPer100g,
    decimal ProteinPer100g,
    decimal CarbsPer100g,
    decimal FatPer100g,
    decimal PortionCalories,
    decimal PortionProtein,
    decimal PortionCarbs,
    decimal PortionFat,
    string Category = "Ogólne"
);

public record GeneratedRecipeDto(
    string Title,
    string Description,
    int PrepTimeMinutes,
    int TotalCalories,
    decimal TotalProtein,
    decimal TotalCarbs,
    decimal TotalFat,
    List<RecipeIngredientDto> Ingredients,
    List<string> Steps,
    string AiModelUsed = "Wbudowany silnik kulinarny MacroGuard"
);

public record AiInfoDto(
    string Provider,
    string ModelName,
    bool IsLiveAi,
    string DisplayName
);

public record ApplyRecipeRequest(
    [Required] DateOnly ConsumedDate,
    [Required] MealType MealType,
    [Required] string RecipeTitle,
    [Required] List<RecipeIngredientDto> Ingredients
);

