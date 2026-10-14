using System.Globalization;
using MacroGuard.Application.DTOs;
using MacroGuard.Application.Interfaces;
using MacroGuard.Domain.Entities;
using MacroGuard.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MacroGuard.Infrastructure.Services;

public class WeightService(MacroGuardDbContext context) : IWeightService
{
    public async Task<WeightEntryDto> LogWeightAsync(Guid userId, LogWeightRequest request, CancellationToken ct = default)
    {
        if (request.WeightKg is < 20m or > 400m)
        {
            throw new ArgumentException("Waga musi mieścić się w przedziale od 20 do 400 kg.");
        }

        var roundedWeight = Math.Round(request.WeightKg, 2);
        var trimmedNote = string.IsNullOrWhiteSpace(request.Note) ? null : request.Note.Trim();

        var existing = await context.WeightEntries
            .FirstOrDefaultAsync(w => w.UserId == userId && w.Date == request.Date, ct);

        WeightEntry entry;
        if (existing is not null)
        {
            existing.WeightKg = roundedWeight;
            existing.Note = trimmedNote;
            entry = existing;
        }
        else
        {
            entry = new WeightEntry
            {
                Id = Guid.NewGuid(),
                UserId = userId,
                Date = request.Date,
                WeightKg = roundedWeight,
                Note = trimmedNote,
                CreatedAtUtc = DateTime.UtcNow
            };
            context.WeightEntries.Add(entry);
        }

        // Jeśli pomiar jest z dzisiaj, zaktualizuj aktualną wagę w profilu użytkownika
        var today = DateOnly.FromDateTime(DateTime.Today);
        if (request.Date == today)
        {
            var profile = await context.UserProfiles.FirstOrDefaultAsync(p => p.UserId == userId, ct);
            if (profile is not null)
            {
                profile.WeightKg = roundedWeight;
            }
        }

        await context.SaveChangesAsync(ct);

        return new WeightEntryDto(
            entry.Id,
            entry.Date,
            entry.WeightKg,
            entry.Note,
            entry.CreatedAtUtc
        );
    }

    public async Task<WeightStatsSummaryDto> GetStatsSummaryAsync(Guid userId, CancellationToken ct = default)
    {
        var entries = await context.WeightEntries
            .Where(w => w.UserId == userId)
            .OrderBy(w => w.Date)
            .ToListAsync(ct);

        if (entries.Count == 0)
        {
            return new WeightStatsSummaryDto(
                CurrentWeightKg: null,
                LastRecordedDate: null,
                StartingWeightKg: null,
                StartingDate: null,
                TotalChangeKg: null,
                AverageThisWeekKg: null,
                AverageLastWeekKg: null,
                WeeklyChangeKg: null,
                WeeklyStats: [],
                RecentEntries: []
            );
        }

        var startingEntry = entries.First();
        var currentEntry = entries.Last();
        var totalChange = Math.Round(currentEntry.WeightKg - startingEntry.WeightKg, 2);

        // Obliczanie średnich tygodniowych (tydzień ISO liczony od poniedziałku do niedzieli)
        var weeklyGroups = entries
            .GroupBy(e =>
            {
                var dt = e.Date.ToDateTime(TimeOnly.MinValue);
                int diff = (7 + (int)e.Date.DayOfWeek - (int)DayOfWeek.Monday) % 7;
                var monday = e.Date.AddDays(-diff);
                var sunday = monday.AddDays(6);
                int weekNum = ISOWeek.GetWeekOfYear(dt);
                int year = ISOWeek.GetYear(dt);
                return (Year: year, WeekNumber: weekNum, StartDate: monday, EndDate: sunday);
            })
            .OrderBy(g => g.Key.StartDate)
            .ToList();

        var weeklyStatsList = new List<WeeklyWeightStatDto>();
        decimal? previousWeekAvg = null;

        foreach (var group in weeklyGroups)
        {
            var avg = Math.Round(group.Average(x => x.WeightKg), 2);
            decimal? change = previousWeekAvg.HasValue ? Math.Round(avg - previousWeekAvg.Value, 2) : null;

            weeklyStatsList.Add(new WeeklyWeightStatDto(
                group.Key.Year,
                group.Key.WeekNumber,
                group.Key.StartDate,
                group.Key.EndDate,
                avg,
                change,
                group.Count()
            ));

            previousWeekAvg = avg;
        }

        // Określenie średniej dla bieżącego i poprzedniego tygodnia kalendarzowego
        var today = DateOnly.FromDateTime(DateTime.Today);
        int currentDiff = (7 + (int)today.DayOfWeek - (int)DayOfWeek.Monday) % 7;
        var currentWeekMonday = today.AddDays(-currentDiff);
        var lastWeekMonday = currentWeekMonday.AddDays(-7);

        var thisWeekStat = weeklyStatsList.FirstOrDefault(w => w.StartDate == currentWeekMonday);
        var lastWeekStat = weeklyStatsList.FirstOrDefault(w => w.StartDate == lastWeekMonday);

        decimal? avgThisWeek = thisWeekStat?.AverageWeightKg;
        decimal? avgLastWeek = lastWeekStat?.AverageWeightKg;
        decimal? weeklyChange = (avgThisWeek.HasValue && avgLastWeek.HasValue)
            ? Math.Round(avgThisWeek.Value - avgLastWeek.Value, 2)
            : (weeklyStatsList.Count >= 2 ? weeklyStatsList[^1].ChangeFromPreviousWeekKg : null);

        var recentEntriesDto = entries
            .OrderByDescending(e => e.Date)
            .Take(30)
            .Select(e => new WeightEntryDto(e.Id, e.Date, e.WeightKg, e.Note, e.CreatedAtUtc))
            .ToList();

        // WeeklyStats posortowane od najnowszego tygodnia dla czytelnej tabeli
        var weeklyStatsSortedDesc = weeklyStatsList.OrderByDescending(w => w.StartDate).ToList();

        return new WeightStatsSummaryDto(
            CurrentWeightKg: currentEntry.WeightKg,
            LastRecordedDate: currentEntry.Date,
            StartingWeightKg: startingEntry.WeightKg,
            StartingDate: startingEntry.Date,
            TotalChangeKg: totalChange,
            AverageThisWeekKg: avgThisWeek,
            AverageLastWeekKg: avgLastWeek,
            WeeklyChangeKg: weeklyChange,
            WeeklyStats: weeklyStatsSortedDesc,
            RecentEntries: recentEntriesDto
        );
    }

    public async Task<List<WeightEntryDto>> GetHistoryAsync(Guid userId, int? limitDays = null, CancellationToken ct = default)
    {
        var query = context.WeightEntries
            .Where(w => w.UserId == userId);

        if (limitDays.HasValue && limitDays.Value > 0)
        {
            var minDate = DateOnly.FromDateTime(DateTime.Today).AddDays(-limitDays.Value);
            query = query.Where(w => w.Date >= minDate);
        }

        var list = await query
            .OrderByDescending(w => w.Date)
            .Select(e => new WeightEntryDto(e.Id, e.Date, e.WeightKg, e.Note, e.CreatedAtUtc))
            .ToListAsync(ct);

        return list;
    }

    public async Task<bool> DeleteWeightEntryAsync(Guid userId, Guid entryId, CancellationToken ct = default)
    {
        var entry = await context.WeightEntries
            .FirstOrDefaultAsync(w => w.Id == entryId && w.UserId == userId, ct);

        if (entry is null)
        {
            return false;
        }

        context.WeightEntries.Remove(entry);
        await context.SaveChangesAsync(ct);
        return true;
    }
}

