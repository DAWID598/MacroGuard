using MacroGuard.Application.DTOs;
using MacroGuard.Application.Interfaces;
using MacroGuard.Domain.Entities;
using MacroGuard.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MacroGuard.Infrastructure.Services;

public class CustomMealSetService(MacroGuardDbContext dbContext) : ICustomMealSetService
{
    public async Task<List<CustomMealSetDto>> GetUserMealSetsAsync(Guid userId, CancellationToken ct = default)
    {
        var sets = await dbContext.CustomMealSets
            .AsNoTracking()
            .Where(s => s.UserId == userId)
            .Include(s => s.Items)
                .ThenInclude(i => i.FoodItem)
            .OrderByDescending(s => s.CreatedAtUtc)
            .ToListAsync(ct);

        return sets.Select(MapToDto).ToList();
    }

    public async Task<CustomMealSetDto> CreateFromMealAsync(Guid userId, CreateMealSetFromMealRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            throw new ArgumentException("Nazwa zestawu nie może być pusta.");
        }

        var sourceEntries = await dbContext.MealEntries
            .Include(e => e.FoodItem)
            .Where(e => e.UserId == userId && e.ConsumedDate == request.SourceDate && e.MealType == request.SourceMealType)
            .ToListAsync(ct);

        if (sourceEntries.Count == 0)
        {
            throw new InvalidOperationException("Wybrany posiłek nie zawiera żadnych produktów do zapisania.");
        }

        var mealSet = new CustomMealSet
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Name = request.Name.Trim(),
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            DefaultMealType = request.SourceMealType,
            CreatedAtUtc = DateTime.UtcNow,
            Items = sourceEntries.Select(e => new CustomMealSetItem
            {
                Id = Guid.NewGuid(),
                FoodItemId = e.FoodItemId,
                WeightGrams = e.WeightGrams
            }).ToList()
        };

        dbContext.CustomMealSets.Add(mealSet);
        await dbContext.SaveChangesAsync(ct);

        // Załaduj powiązane FoodItem do zmapowania DTO
        var created = await dbContext.CustomMealSets
            .Include(s => s.Items)
                .ThenInclude(i => i.FoodItem)
            .FirstAsync(s => s.Id == mealSet.Id, ct);

        return MapToDto(created);
    }

    public async Task<List<MealEntryDto>> ApplyMealSetAsync(Guid userId, Guid mealSetId, ApplyMealSetRequest request, CancellationToken ct = default)
    {
        var mealSet = await dbContext.CustomMealSets
            .Include(s => s.Items)
                .ThenInclude(i => i.FoodItem)
            .FirstOrDefaultAsync(s => s.Id == mealSetId && s.UserId == userId, ct);

        if (mealSet is null)
        {
            throw new KeyNotFoundException("Nie znaleziono wybranego zestawu.");
        }

        var newEntries = mealSet.Items.Select(item => new MealEntry
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            FoodItemId = item.FoodItemId,
            ConsumedDate = request.TargetDate,
            MealType = request.TargetMealType,
            WeightGrams = item.WeightGrams
        }).ToList();

        await dbContext.MealEntries.AddRangeAsync(newEntries, ct);
        await dbContext.SaveChangesAsync(ct);

        // Przeładuj z FoodItem aby zwrócić pełne DTO
        var entryIds = newEntries.Select(e => e.Id).ToList();
        var savedEntries = await dbContext.MealEntries
            .Include(e => e.FoodItem)
            .Where(e => entryIds.Contains(e.Id))
            .ToListAsync(ct);

        return savedEntries.Select(e => new MealEntryDto(
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
        )).ToList();
    }

    public async Task<bool> DeleteMealSetAsync(Guid userId, Guid mealSetId, CancellationToken ct = default)
    {
        var mealSet = await dbContext.CustomMealSets
            .FirstOrDefaultAsync(s => s.Id == mealSetId && s.UserId == userId, ct);

        if (mealSet is null)
        {
            return false;
        }

        dbContext.CustomMealSets.Remove(mealSet);
        await dbContext.SaveChangesAsync(ct);
        return true;
    }

    private static CustomMealSetDto MapToDto(CustomMealSet set)
    {
        var itemsDto = set.Items.Select(i =>
        {
            var factor = i.WeightGrams / 100m;
            var cal = Math.Round((i.FoodItem?.CaloriesPer100g ?? 0) * factor, 1);
            var p = Math.Round((i.FoodItem?.ProteinPer100g ?? 0) * factor, 1);
            var c = Math.Round((i.FoodItem?.CarbsPer100g ?? 0) * factor, 1);
            var f = Math.Round((i.FoodItem?.FatPer100g ?? 0) * factor, 1);

            return new CustomMealSetItemDto(
                Id: i.Id,
                FoodItemId: i.FoodItemId,
                FoodName: i.FoodItem?.Name ?? "Produkt",
                Brand: i.FoodItem?.Brand,
                WeightGrams: i.WeightGrams,
                Calories: cal,
                Protein: p,
                Carbs: c,
                Fat: f
            );
        }).ToList();

        var totalCal = itemsDto.Sum(i => i.Calories);
        var totalP = itemsDto.Sum(i => i.Protein);
        var totalC = itemsDto.Sum(i => i.Carbs);
        var totalF = itemsDto.Sum(i => i.Fat);

        return new CustomMealSetDto(
            Id: set.Id,
            Name: set.Name,
            Description: set.Description,
            DefaultMealType: set.DefaultMealType,
            TotalCalories: Math.Round(totalCal, 1),
            TotalProtein: Math.Round(totalP, 1),
            TotalCarbs: Math.Round(totalC, 1),
            TotalFat: Math.Round(totalF, 1),
            ItemsCount: itemsDto.Count,
            Items: itemsDto
        );
    }
}

