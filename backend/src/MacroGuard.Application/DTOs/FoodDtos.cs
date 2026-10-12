using System.ComponentModel.DataAnnotations;

namespace MacroGuard.Application.DTOs;

public record FoodItemDto(
    Guid Id,
    string Name,
    string? Brand,
    string Category,
    decimal CaloriesPer100g,
    decimal ProteinPer100g,
    decimal CarbsPer100g,
    decimal FatPer100g,
    bool IsCustom
);

public record CreateFoodItemRequest(
    [Required, MinLength(2)] string Name,
    string? Brand,
    string Category,
    [Range(0, 1000)] decimal CaloriesPer100g,
    [Range(0, 100)] decimal ProteinPer100g,
    [Range(0, 100)] decimal CarbsPer100g,
    [Range(0, 100)] decimal FatPer100g
);

