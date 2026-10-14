namespace MacroGuard.Application.DTOs;

public record AiCoachRequest(
    int Days = 7
);

public record AiCoachReportDto(
    string Headline,
    string Summary,
    string CalorieAnalysis,
    string MacroAnalysis,
    string WeightTrendAnalysis,
    List<string> Recommendations,
    decimal AvgCalories,
    int TargetCalories,
    decimal AvgProteinGrams,
    int TargetProteinGrams,
    decimal? WeightChangeKg,
    int LoggedDaysCount,
    int TotalDaysInPeriod,
    string AiModelUsed,
    DateTime GeneratedAtUtc
);

