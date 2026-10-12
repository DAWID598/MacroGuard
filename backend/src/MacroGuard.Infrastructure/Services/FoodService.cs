using MacroGuard.Application.DTOs;
using MacroGuard.Application.Interfaces;
using MacroGuard.Domain.Entities;
using MacroGuard.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MacroGuard.Infrastructure.Services;

public class FoodService(MacroGuardDbContext dbContext) : IFoodService
{
    public async Task<List<FoodItemDto>> SearchFoodsAsync(Guid userId, string? query, string? category, CancellationToken ct = default)
    {
        var foodsQuery = dbContext.FoodItems
            .AsNoTracking()
            .Where(f => f.CreatedByUserId == null || f.CreatedByUserId == userId);

        if (!string.IsNullOrWhiteSpace(query))
        {
            var normalized = query.Trim().ToLower();
            foodsQuery = foodsQuery.Where(f =>
                f.Name.ToLower().Contains(normalized) ||
                (f.Brand != null && f.Brand.ToLower().Contains(normalized)));
        }

        if (!string.IsNullOrWhiteSpace(category) && category != "Wszystkie")
        {
            foodsQuery = foodsQuery.Where(f => f.Category == category);
        }

        var items = await foodsQuery
            .OrderByDescending(f => f.CreatedByUserId == userId)
            .ThenBy(f => f.Name)
            .Take(60)
            .ToListAsync(ct);

        return items.Select(f => new FoodItemDto(
            f.Id,
            f.Name,
            f.Brand,
            f.Category,
            f.CaloriesPer100g,
            f.ProteinPer100g,
            f.CarbsPer100g,
            f.FatPer100g,
            f.CreatedByUserId == userId
        )).ToList();
    }

    public async Task<FoodItemDto> CreateFoodAsync(Guid userId, CreateFoodItemRequest request, CancellationToken ct = default)
    {
        var food = new FoodItem
        {
            Name = request.Name.Trim(),
            Brand = string.IsNullOrWhiteSpace(request.Brand) ? null : request.Brand.Trim(),
            Category = string.IsNullOrWhiteSpace(request.Category) ? "Własne" : request.Category.Trim(),
            CaloriesPer100g = request.CaloriesPer100g,
            ProteinPer100g = request.ProteinPer100g,
            CarbsPer100g = request.CarbsPer100g,
            FatPer100g = request.FatPer100g,
            CreatedByUserId = userId
        };

        dbContext.FoodItems.Add(food);
        await dbContext.SaveChangesAsync(ct);

        return new FoodItemDto(
            food.Id,
            food.Name,
            food.Brand,
            food.Category,
            food.CaloriesPer100g,
            food.ProteinPer100g,
            food.CarbsPer100g,
            food.FatPer100g,
            true
        );
    }
}

