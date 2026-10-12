using MacroGuard.Domain.Enums;

namespace MacroGuard.Domain.Entities;

public class MealEntry
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public Guid FoodItemId { get; set; }
    public FoodItem? FoodItem { get; set; }
    public DateOnly ConsumedDate { get; set; }
    public MealType MealType { get; set; }
    public decimal WeightGrams { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public decimal CalculatedCalories => FoodItem is null ? 0 : Math.Round(FoodItem.CaloriesPer100g * WeightGrams / 100m, 1);
    public decimal CalculatedProtein => FoodItem is null ? 0 : Math.Round(FoodItem.ProteinPer100g * WeightGrams / 100m, 1);
    public decimal CalculatedCarbs => FoodItem is null ? 0 : Math.Round(FoodItem.CarbsPer100g * WeightGrams / 100m, 1);
    public decimal CalculatedFat => FoodItem is null ? 0 : Math.Round(FoodItem.FatPer100g * WeightGrams / 100m, 1);
}

