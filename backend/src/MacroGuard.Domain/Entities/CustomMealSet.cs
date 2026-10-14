using MacroGuard.Domain.Enums;

namespace MacroGuard.Domain.Entities;

public class CustomMealSet
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public MealType? DefaultMealType { get; set; }
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public List<CustomMealSetItem> Items { get; set; } = [];
}

