namespace MacroGuard.Application.DTOs;

public record LogWeightRequest(
    DateOnly Date,
    decimal WeightKg,
    string? Note
);

public record WeightEntryDto(
    Guid Id,
    DateOnly Date,
    decimal WeightKg,
    string? Note,
    DateTime CreatedAtUtc
);

public record WeeklyWeightStatDto(
    int Year,
    int WeekNumber,
    DateOnly StartDate,
    DateOnly EndDate,
    decimal AverageWeightKg,
    decimal? ChangeFromPreviousWeekKg,
    int EntriesCount
);

public record WeightStatsSummaryDto(
    decimal? CurrentWeightKg,
    DateOnly? LastRecordedDate,
    decimal? StartingWeightKg,
    DateOnly? StartingDate,
    decimal? TotalChangeKg,
    decimal? AverageThisWeekKg,
    decimal? AverageLastWeekKg,
    decimal? WeeklyChangeKg,
    List<WeeklyWeightStatDto> WeeklyStats,
    List<WeightEntryDto> RecentEntries
);

