using MacroGuard.Application.DTOs;
using MacroGuard.Application.Interfaces;
using MacroGuard.Domain.Entities;
using MacroGuard.Domain.Enums;
using MacroGuard.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MacroGuard.Infrastructure.Services;

public class DiaryService(MacroGuardDbContext dbContext, IProfileService profileService) : IDiaryService
{
    private static readonly (MealType Type, string Label)[] FourMealTypes =
    [
        (MealType.Breakfast, "Śniadanie"),
        (MealType.Lunch, "Obiad"),
        (MealType.Snack, "Przekąska"),
        (MealType.Dinner, "Kolacja")
    ];

    public async Task<DailyDiaryDto> GetDailyDiaryAsync(Guid userId, DateOnly date, CancellationToken ct = default)
    {
        var profile = await profileService.GetProfileAsync(userId, ct);

        var entries = await dbContext.MealEntries
            .AsNoTracking()
            .Include(e => e.FoodItem)
            .Where(e => e.UserId == userId && e.ConsumedDate == date)
            .OrderBy(e => e.CreatedAtUtc)
            .ToListAsync(ct);

        var mealGroups = new List<MealGroupDto>();

        foreach (var (mealType, label) in FourMealTypes)
        {
            var groupEntries = entries
                .Where(e => e.MealType == mealType)
                .Select(MapEntryToDto)
                .ToList();

            mealGroups.Add(new MealGroupDto(
                MealType: mealType,
                MealName: label,
                TotalCalories: Math.Round(groupEntries.Sum(x => x.Calories), 1),
                TotalProtein: Math.Round(groupEntries.Sum(x => x.Protein), 1),
                TotalCarbs: Math.Round(groupEntries.Sum(x => x.Carbs), 1),
                TotalFat: Math.Round(groupEntries.Sum(x => x.Fat), 1),
                Entries: groupEntries
            ));
        }

        return new DailyDiaryDto(
            Date: date,
            TargetCalories: profile.TargetCalories,
            TargetProteinGrams: profile.TargetProteinGrams,
            TargetCarbsGrams: profile.TargetCarbsGrams,
            TargetFatGrams: profile.TargetFatGrams,
            ConsumedCalories: Math.Round(mealGroups.Sum(m => m.TotalCalories), 1),
            ConsumedProteinGrams: Math.Round(mealGroups.Sum(m => m.TotalProtein), 1),
            ConsumedCarbsGrams: Math.Round(mealGroups.Sum(m => m.TotalCarbs), 1),
            ConsumedFatGrams: Math.Round(mealGroups.Sum(m => m.TotalFat), 1),
            Meals: mealGroups
        );
    }

    public async Task<MealEntryDto> AddMealEntryAsync(Guid userId, AddMealEntryRequest request, CancellationToken ct = default)
    {
        var food = await dbContext.FoodItems.FirstOrDefaultAsync(f => f.Id == request.FoodItemId, ct)
            ?? throw new KeyNotFoundException("Wybrany produkt spożywczy nie istnieje.");

        var entry = new MealEntry
        {
            UserId = userId,
            FoodItemId = food.Id,
            FoodItem = food,
            ConsumedDate = request.ConsumedDate,
            MealType = request.MealType,
            WeightGrams = request.WeightGrams
        };

        dbContext.MealEntries.Add(entry);
        await dbContext.SaveChangesAsync(ct);

        return MapEntryToDto(entry);
    }

    public async Task<bool> DeleteMealEntryAsync(Guid userId, Guid entryId, CancellationToken ct = default)
    {
        var entry = await dbContext.MealEntries.FirstOrDefaultAsync(e => e.Id == entryId && e.UserId == userId, ct);
        if (entry is null)
        {
            return false;
        }

        dbContext.MealEntries.Remove(entry);
        await dbContext.SaveChangesAsync(ct);
        return true;
    }

    private static MealEntryDto MapEntryToDto(MealEntry e) => new(
        Id: e.Id,
        FoodItemId: e.FoodItemId,
        FoodName: e.FoodItem?.Name ?? "Produkt",
        Brand: e.FoodItem?.Brand,
        MealType: e.MealType,
        WeightGrams: e.WeightGrams,
        Calories: e.CalculatedCalories,
        Protein: e.CalculatedProtein,
        Carbs: e.CalculatedCarbs,
        Fat: e.CalculatedFat
    );
}

