using MacroGuard.Domain.Enums;

namespace MacroGuard.Application.DTOs;

public record CustomMealSetItemDto(
    Guid Id,
    Guid FoodItemId,
    string FoodName,
    string? Brand,
    decimal WeightGrams,
    decimal Calories,
    decimal Protein,
    decimal Carbs,
    decimal Fat
);

public record CustomMealSetDto(
    Guid Id,
    string Name,
    string? Description,
    MealType? DefaultMealType,
    decimal TotalCalories,
    decimal TotalProtein,
    decimal TotalCarbs,
    decimal TotalFat,
    int ItemsCount,
    List<CustomMealSetItemDto> Items
);

public record CreateMealSetFromMealRequest(
    string Name,
    string? Description,
    DateOnly SourceDate,
    MealType SourceMealType
);

public record ApplyMealSetRequest(
    DateOnly TargetDate,
    MealType TargetMealType
);

