using MacroGuard.Domain.Enums;

namespace MacroGuard.Application.DTOs;

public record DailyReportItemDto(
    DateOnly Date,
    decimal ConsumedCalories,
    decimal ConsumedProtein,
    decimal ConsumedCarbs,
    decimal ConsumedFat,
    decimal? WeightKg
);

public record PeriodReportDto(
    string UserDisplayName,
    DietGoal Goal,
    int TargetCalories,
    int TargetProteinGrams,
    int TargetCarbsGrams,
    int TargetFatGrams,
    DateOnly StartDate,
    DateOnly EndDate,
    int TotalDays,
    int LoggedDays,
    decimal AvgCalories,
    decimal AvgProtein,
    decimal AvgCarbs,
    decimal AvgFat,
    decimal CalorieAdherencePercent,
    decimal? StartWeightKg,
    decimal? EndWeightKg,
    decimal? WeightChangeKg,
    List<DailyReportItemDto> DailyRecords,
    DateTime GeneratedAtUtc
);

