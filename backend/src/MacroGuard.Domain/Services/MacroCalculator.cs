using MacroGuard.Domain.Enums;

namespace MacroGuard.Domain.Services;

public record MacroCalculationResult(
    int BmrCalories,
    int TdeeCalories,
    int TargetCalories,
    int TargetProteinGrams,
    int TargetCarbsGrams,
    int TargetFatGrams,
    decimal? TargetWeightKg = null,
    decimal? WeightDifferenceKg = null,
    decimal? WeeklyChangeKg = null,
    int? DeficitCalories = null,
    int? EstimatedWeeks = null,
    bool IsBelowBmr = false
);

public static class MacroCalculator
{
    public static MacroCalculationResult Calculate(
        int age,
        Gender gender,
        decimal weightKg,
        decimal heightCm,
        ActivityLevel activityLevel,
        DietGoal goal,
        decimal? targetWeightKg = null,
        int? deficitPercentage = null,
        decimal? weeklyChangeKg = null)
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
            ActivityLevel.PhysicalWork => 1.6m,
            ActivityLevel.VeryActive => 1.725m,
            ActivityLevel.ExtraActive => 1.9m,
            _ => 1.55m
        };

        int tdee = (int)Math.Round(bmrRaw * palMultiplier);

        int targetCalories;
        int deficitCalories = 0;
        decimal effectiveWeeklyLoss = 0m;

        switch (goal)
        {
            case DietGoal.Cut:
                if (deficitPercentage.HasValue && deficitPercentage.Value > 0)
                {
                    int pct = Math.Clamp(deficitPercentage.Value, 5, 40);
                    targetCalories = (int)Math.Round(tdee * (1.0m - (pct / 100m)));
                    deficitCalories = tdee - targetCalories;
                    effectiveWeeklyLoss = Math.Round((decimal)deficitCalories * 7m / 7700m, 2);
                }
                else if (weeklyChangeKg.HasValue && weeklyChangeKg.Value > 0)
                {
                    decimal loss = Math.Clamp(weeklyChangeKg.Value, 0.1m, 1.5m);
                    deficitCalories = (int)Math.Round((loss * 7700m) / 7m);
                    targetCalories = tdee - deficitCalories;
                    effectiveWeeklyLoss = loss;
                }
                else
                {
                    // Domyślnie -15%
                    targetCalories = (int)Math.Round(tdee * 0.85m);
                    deficitCalories = tdee - targetCalories;
                    effectiveWeeklyLoss = Math.Round((decimal)deficitCalories * 7m / 7700m, 2);
                }
                break;

            case DietGoal.Bulk:
                if (deficitPercentage.HasValue && deficitPercentage.Value > 0)
                {
                    int pct = Math.Clamp(deficitPercentage.Value, 5, 30);
                    targetCalories = (int)Math.Round(tdee * (1.0m + (pct / 100m)));
                    deficitCalories = targetCalories - tdee; // nadwyżka
                    effectiveWeeklyLoss = Math.Round((decimal)deficitCalories * 7m / 7700m, 2);
                }
                else if (weeklyChangeKg.HasValue && weeklyChangeKg.Value > 0)
                {
                    decimal gain = Math.Clamp(weeklyChangeKg.Value, 0.1m, 0.8m);
                    deficitCalories = (int)Math.Round((gain * 7700m) / 7m);
                    targetCalories = tdee + deficitCalories;
                    effectiveWeeklyLoss = gain;
                }
                else
                {
                    // Domyślnie +12%
                    targetCalories = (int)Math.Round(tdee * 1.12m);
                    deficitCalories = targetCalories - tdee;
                    effectiveWeeklyLoss = Math.Round((decimal)deficitCalories * 7m / 7700m, 2);
                }
                break;

            case DietGoal.Maintain:
            default:
                targetCalories = tdee;
                deficitCalories = 0;
                effectiveWeeklyLoss = 0m;
                break;
        }

        bool isBelowBmr = targetCalories < bmr && goal == DietGoal.Cut;
        targetCalories = Math.Max(1100, targetCalories);

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

        // Szacowanie czasu do osiągnięcia celu
        decimal? weightDiff = null;
        int? estimatedWeeks = null;

        if (targetWeightKg.HasValue && targetWeightKg.Value > 0)
        {
            weightDiff = Math.Round(Math.Abs(weightKg - targetWeightKg.Value), 2);
            if (effectiveWeeklyLoss > 0 && weightDiff > 0)
            {
                estimatedWeeks = (int)Math.Ceiling(weightDiff.Value / effectiveWeeklyLoss);
            }
        }

        return new MacroCalculationResult(
            BmrCalories: bmr,
            TdeeCalories: tdee,
            TargetCalories: targetCalories,
            TargetProteinGrams: proteinGrams,
            TargetCarbsGrams: carbsGrams,
            TargetFatGrams: fatGrams,
            TargetWeightKg: targetWeightKg,
            WeightDifferenceKg: weightDiff,
            WeeklyChangeKg: effectiveWeeklyLoss > 0 ? effectiveWeeklyLoss : null,
            DeficitCalories: deficitCalories != 0 ? deficitCalories : null,
            EstimatedWeeks: estimatedWeeks,
            IsBelowBmr: isBelowBmr
        );
    }
}

