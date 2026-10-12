using MacroGuard.Domain.Enums;

namespace MacroGuard.Domain.Services;

public record MacroCalculationResult(
    int BmrCalories,
    int TdeeCalories,
    int TargetCalories,
    int TargetProteinGrams,
    int TargetCarbsGrams,
    int TargetFatGrams
);

public static class MacroCalculator
{
    public static MacroCalculationResult Calculate(
        int age,
        Gender gender,
        decimal weightKg,
        decimal heightCm,
        ActivityLevel activityLevel,
        DietGoal goal)
    {
        // Wzór Mifflin-St Jeor
        decimal genderOffset = gender == Gender.Male ? 5m : -161m;
        decimal bmrRaw = (10m * weightKg) + (6.25m * heightCm) - (5m * age) + genderOffset;
        int bmr = (int)Math.Round(bmrRaw);

        decimal palMultiplier = activityLevel switch
        {
            ActivityLevel.Sedentary => 1.2m,
            ActivityLevel.LightlyActive => 1.375m,
            ActivityLevel.ModeratelyActive => 1.55m,
            ActivityLevel.VeryActive => 1.725m,
            ActivityLevel.ExtraActive => 1.9m,
            _ => 1.55m
        };

        int tdee = (int)Math.Round(bmrRaw * palMultiplier);

        decimal goalMultiplier = goal switch
        {
            DietGoal.Cut => 0.85m,      // -15% deficyt
            DietGoal.Maintain => 1.0m,  // 0% zero kaloryczne
            DietGoal.Bulk => 1.12m,     // +12% nadwyżka
            _ => 1.0m
        };

        int targetCalories = Math.Max(1200, (int)Math.Round(tdee * goalMultiplier));

        // Rozkład makroskładników:
        // Białko: 2.0 g/kg na redukcji, 1.8 g/kg na utrzymaniu/masie
        decimal proteinPerKg = goal == DietGoal.Cut ? 2.0m : 1.8m;
        int proteinGrams = (int)Math.Round(weightKg * proteinPerKg);
        int proteinCalories = proteinGrams * 4;

        // Tłuszcze: ~27% kalorii (minimum 0.8 g/kg)
        int fatGramsFromPct = (int)Math.Round((targetCalories * 0.27m) / 9m);
        int minFatGrams = (int)Math.Round(weightKg * 0.8m);
        int fatGrams = Math.Max(minFatGrams, fatGramsFromPct);
        int fatCalories = fatGrams * 9;

        // Węglowodany: reszta kalorii (1g = 4 kcal)
        int remainingCalories = Math.Max(200, targetCalories - proteinCalories - fatCalories);
        int carbsGrams = (int)Math.Round(remainingCalories / 4m);

        return new MacroCalculationResult(
            BmrCalories: bmr,
            TdeeCalories: tdee,
            TargetCalories: targetCalories,
            TargetProteinGrams: proteinGrams,
            TargetCarbsGrams: carbsGrams,
            TargetFatGrams: fatGrams
        );
    }
}

