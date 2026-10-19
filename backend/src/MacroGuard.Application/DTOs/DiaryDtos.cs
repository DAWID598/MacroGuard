using System.ComponentModel.DataAnnotations;
using MacroGuard.Domain.Enums;

namespace MacroGuard.Application.DTOs;

public record MealEntryDto(
    Guid Id,
    Guid FoodItemId,
    string FoodName,
    string? Brand,
    MealType MealType,
    decimal WeightGrams,
    decimal Calories,
    decimal Protein,
    decimal Carbs,
    decimal Fat
);

public record MealGroupDto(
    MealType MealType,
    string MealName,
    decimal TotalCalories,
    decimal TotalProtein,
    decimal TotalCarbs,
    decimal TotalFat,
    List<MealEntryDto> Entries
);

public record DailyDiaryDto(
    DateOnly Date,
    int TargetCalories,
    int TargetProteinGrams,
    int TargetCarbsGrams,
    int TargetFatGrams,
    decimal ConsumedCalories,
    decimal ConsumedProteinGrams,
    decimal ConsumedCarbsGrams,
    decimal ConsumedFatGrams,
    List<MealGroupDto> Meals
);

public record AddMealEntryRequest(
    [Required] Guid FoodItemId,
    [Required] DateOnly ConsumedDate,
    [Required] MealType MealType,
    [Range(1, 5000)] decimal WeightGrams
);

public record CopyMealRequest(
    DateOnly SourceDate,
    MealType SourceMealType,
    DateOnly TargetDate,
    MealType TargetMealType
);

public record CopyDayRequest(
    DateOnly SourceDate,
    DateOnly TargetDate
);

public record CopyResultDto(
    int CopiedEntriesCount,
    string Message
);

