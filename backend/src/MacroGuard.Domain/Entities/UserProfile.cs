using MacroGuard.Domain.Enums;

namespace MacroGuard.Domain.Entities;

public class UserProfile
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public int Age { get; set; } = 25;
    public Gender Gender { get; set; } = Gender.Male;
    public decimal WeightKg { get; set; } = 75m;
    public decimal HeightCm { get; set; } = 178m;
    public ActivityLevel ActivityLevel { get; set; } = ActivityLevel.ModeratelyActive;
    public DietGoal Goal { get; set; } = DietGoal.Maintain;

    public int BmrCalories { get; set; } = 1750;
    public int TdeeCalories { get; set; } = 2700;
    public int TargetCalories { get; set; } = 2700;
    public int TargetProteinGrams { get; set; } = 150;
    public int TargetCarbsGrams { get; set; } = 325;
    public int TargetFatGrams { get; set; } = 85;

    public decimal? TargetWeightKg { get; set; }
    public int? DeficitPercentage { get; set; }
    public decimal? WeeklyChangeKg { get; set; }

    public DateTime UpdatedAtUtc { get; set; } = DateTime.UtcNow;
}

