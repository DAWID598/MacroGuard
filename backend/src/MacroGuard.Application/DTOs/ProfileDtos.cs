using System.ComponentModel.DataAnnotations;
using MacroGuard.Domain.Enums;

namespace MacroGuard.Application.DTOs;

public record UserProfileDto(
    Guid Id,
    int Age,
    Gender Gender,
    decimal WeightKg,
    decimal HeightCm,
    ActivityLevel ActivityLevel,
    DietGoal Goal,
    int BmrCalories,
    int TdeeCalories,
    int TargetCalories,
    int TargetProteinGrams,
    int TargetCarbsGrams,
    int TargetFatGrams,
    decimal? TargetWeightKg = null,
    int? DeficitPercentage = null,
    decimal? WeeklyChangeKg = null,
    decimal? WeightDifferenceKg = null,
    int? DeficitCalories = null,
    int? EstimatedWeeks = null,
    bool IsBelowBmr = false
);

public record CalculateProfileRequest(
    [Range(12, 120)] int Age,
    Gender Gender,
    [Range(30, 300)] decimal WeightKg,
    [Range(100, 250)] decimal HeightCm,
    ActivityLevel ActivityLevel,
    DietGoal Goal,
    decimal? TargetWeightKg = null,
    int? DeficitPercentage = null,
    decimal? WeeklyChangeKg = null,
    int? CustomCalories = null,
    int? CustomProteinGrams = null,
    int? CustomCarbsGrams = null,
    int? CustomFatGrams = null
);

