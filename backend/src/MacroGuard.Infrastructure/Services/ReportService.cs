using MacroGuard.Application.DTOs;
using MacroGuard.Application.Interfaces;
using MacroGuard.Domain.Enums;
using MacroGuard.Infrastructure.Identity;
using MacroGuard.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace MacroGuard.Infrastructure.Services;

public class ReportService(
    MacroGuardDbContext dbContext,
    UserManager<ApplicationUser> userManager) : IReportService
{
    public async Task<PeriodReportDto> GeneratePeriodReportAsync(Guid userId, int days, CancellationToken ct = default)
    {
        if (days <= 0) days = 7;
        if (days > 90) days = 90;

        var user = await userManager.FindByIdAsync(userId.ToString());
        var profile = await dbContext.UserProfiles.FirstOrDefaultAsync(p => p.UserId == userId, ct);

        var displayName = user?.DisplayName ?? "Użytkownik MacroGuard";
        var goal = profile?.Goal ?? DietGoal.Maintain;
        var targetCalories = profile?.TargetCalories ?? 2000;
        var targetProtein = profile?.TargetProteinGrams ?? 140;
        var targetCarbs = profile?.TargetCarbsGrams ?? 200;
        var targetFat = profile?.TargetFatGrams ?? 65;

        var today = DateOnly.FromDateTime(DateTime.Today);
        var endDate = today;
        var startDate = today.AddDays(-(days - 1));

        // Pomiary wagi w danym okresie
        var weightEntries = await dbContext.WeightEntries
            .AsNoTracking()
            .Where(w => w.UserId == userId && w.Date >= startDate && w.Date <= endDate)
            .OrderBy(w => w.Date)
            .ToListAsync(ct);

        decimal? startWeight = weightEntries.FirstOrDefault()?.WeightKg;
        decimal? endWeight = weightEntries.LastOrDefault()?.WeightKg;
        decimal? weightChange = (startWeight.HasValue && endWeight.HasValue)
            ? Math.Round(endWeight.Value - startWeight.Value, 2)
            : null;

        // Posiłki w danym okresie
        var mealEntries = await dbContext.MealEntries
            .AsNoTracking()
            .Where(m => m.UserId == userId && m.ConsumedDate >= startDate && m.ConsumedDate <= endDate)
            .Include(m => m.FoodItem)
            .ToListAsync(ct);

        var mealsByDate = mealEntries.GroupBy(m => m.ConsumedDate).ToDictionary(g => g.Key, g => g.ToList());
        var weightsByDate = weightEntries.ToDictionary(w => w.Date, w => w.WeightKg);

        var dailyRecords = new List<DailyReportItemDto>();
        for (var d = startDate; d <= endDate; d = d.AddDays(1))
        {
            mealsByDate.TryGetValue(d, out var dayMeals);
            weightsByDate.TryGetValue(d, out var dayWeight);

            decimal cKcal = 0, cProt = 0, cCarbs = 0, cFat = 0;
            if (dayMeals is not null)
            {
                cKcal = Math.Round(dayMeals.Sum(m => m.CalculatedCalories), 1);
                cProt = Math.Round(dayMeals.Sum(m => m.CalculatedProtein), 1);
                cCarbs = Math.Round(dayMeals.Sum(m => m.CalculatedCarbs), 1);
                cFat = Math.Round(dayMeals.Sum(m => m.CalculatedFat), 1);
            }

            dailyRecords.Add(new DailyReportItemDto(
                Date: d,
                ConsumedCalories: cKcal,
                ConsumedProtein: cProt,
                ConsumedCarbs: cCarbs,
                ConsumedFat: cFat,
                WeightKg: dayWeight != 0 ? dayWeight : null
            ));
        }

        var loggedDays = dailyRecords.Where(r => r.ConsumedCalories > 0).ToList();
        var loggedDaysCount = loggedDays.Count;

        decimal avgCalories = loggedDaysCount > 0 ? Math.Round(loggedDays.Average(r => r.ConsumedCalories), 1) : 0;
        decimal avgProtein = loggedDaysCount > 0 ? Math.Round(loggedDays.Average(r => r.ConsumedProtein), 1) : 0;
        decimal avgCarbs = loggedDaysCount > 0 ? Math.Round(loggedDays.Average(r => r.ConsumedCarbs), 1) : 0;
        decimal avgFat = loggedDaysCount > 0 ? Math.Round(loggedDays.Average(r => r.ConsumedFat), 1) : 0;

        decimal adherencePct = targetCalories > 0 && avgCalories > 0
            ? Math.Round((avgCalories / targetCalories) * 100, 1)
            : 0;

        return new PeriodReportDto(
            UserDisplayName: displayName,
            Goal: goal,
            TargetCalories: targetCalories,
            TargetProteinGrams: targetProtein,
            TargetCarbsGrams: targetCarbs,
            TargetFatGrams: targetFat,
            StartDate: startDate,
            EndDate: endDate,
            TotalDays: days,
            LoggedDays: loggedDaysCount,
            AvgCalories: avgCalories,
            AvgProtein: avgProtein,
            AvgCarbs: avgCarbs,
            AvgFat: avgFat,
            CalorieAdherencePercent: adherencePct,
            StartWeightKg: startWeight,
            EndWeightKg: endWeight,
            WeightChangeKg: weightChange,
            DailyRecords: dailyRecords.OrderByDescending(r => r.Date).ToList(),
            GeneratedAtUtc: DateTime.UtcNow
        );
    }
}

