namespace MacroGuard.Domain.Entities;

public class CustomMealSetItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid CustomMealSetId { get; set; }
    public CustomMealSet? CustomMealSet { get; set; }
    public Guid FoodItemId { get; set; }
    public FoodItem? FoodItem { get; set; }
    public decimal WeightGrams { get; set; }
}

