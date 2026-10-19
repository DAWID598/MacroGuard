using FluentAssertions;
using MacroGuard.Domain.Enums;
using MacroGuard.Domain.Services;
using Xunit;

namespace MacroGuard.UnitTests;

/// <summary>
/// Testy jednostkowe algorytmu BMR / TDEE (Wzór Mifflin-St Jeor).
/// Pokrywają przypadki testowe: TC-CALC-001 oraz TC-CALC-002 z TEST_CASES.md.
/// </summary>
public class BmrCalculatorTests
{
    [Fact]
    public void Calculate_MaleStandardCutProfile_ReturnsExactValuesAccordingToTcCalc001()
    {
        // Arrange (Warunki z TC-CALC-001: Mężczyzna, 25 lat, 180 cm, 80 kg, umiarkowana aktywność, redukcja -15%, cel 74 kg)
        const int age = 25;
        const Gender gender = Gender.Male;
        const decimal weightKg = 80m;
        const decimal heightCm = 180m;
        const ActivityLevel activity = ActivityLevel.ModeratelyActive; // 1.55
        const DietGoal goal = DietGoal.Cut;
        const decimal targetWeight = 74m;
        const int deficitPct = 15;

        // Act
        var result = MacroCalculator.Calculate(
            age, gender, weightKg, heightCm, activity, goal,
            targetWeightKg: targetWeight,
            deficitPercentage: deficitPct);

        // Assert
        // BMR = (10 * 80) + (6.25 * 180) - (5 * 25) + 5 = 800 + 1125 - 125 + 5 = 1805 kcal
        result.BmrCalories.Should().Be(1805);

        // TDEE = 1805 * 1.55 = 2797.75 -> zaokrąglone do 2798 kcal
        result.TdeeCalories.Should().Be(2798);

        // Docelowe kalorie (-15% z 2798) = 2798 * 0.85 = 2378.3 -> 2378 kcal
        result.TargetCalories.Should().Be(2378);

        // Deficyt = 2798 - 2378 = 420 kcal
        result.DeficitCalories.Should().Be(420);

        // Białko na redukcji: 2.0g / kg = 80 * 2.0 = 160g
        result.TargetProteinGrams.Should().Be(160);

        // Waga docelowa i różnica: 80 - 74 = 6 kg
        result.WeightDifferenceKg.Should().Be(6.0m);
        result.EstimatedWeeks.Should().NotBeNull();
        result.EstimatedWeeks.Should().BeGreaterThan(0);

        // Kalorie 2378 > BMR 1805, więc nie schodzimy poniżej BMR
        result.IsBelowBmr.Should().BeFalse();
    }

    [Fact]
    public void Calculate_FemaleProfile_AppliesCorrectNegativeOffsetMinus161()
    {
        // Arrange (Kobieta: 30 lat, 165 cm, 60 kg, niska aktywność)
        const int age = 30;
        const Gender gender = Gender.Female;
        const decimal weightKg = 60m;
        const decimal heightCm = 165m;
        const ActivityLevel activity = ActivityLevel.Sedentary; // 1.2
        const DietGoal goal = DietGoal.Maintain;

        // Act
        var result = MacroCalculator.Calculate(age, gender, weightKg, heightCm, activity, goal);

        // Assert
        // BMR = (10 * 60) + (6.25 * 165) - (5 * 30) - 161 = 600 + 1031.25 - 150 - 161 = 1320.25 -> 1320 kcal
        result.BmrCalories.Should().Be(1320);

        // TDEE = 1320.25 * 1.2 = 1584.3 -> 1584 kcal
        result.TdeeCalories.Should().Be(1584);
        result.TargetCalories.Should().Be(1584);
        result.IsBelowBmr.Should().BeFalse();
    }

    [Fact]
    public void Calculate_AggressiveDeficitBelowBmr_SetsIsBelowBmrFlagToTrueAccordingToTcCalc002()
    {
        // Arrange (Warunki z TC-CALC-002: Kobieta, 30 lat, 160 cm, 55 kg, niska aktywność 1.2, agresywny deficyt -35%)
        const int age = 30;
        const Gender gender = Gender.Female;
        const decimal weightKg = 55m;
        const decimal heightCm = 160m;
        const ActivityLevel activity = ActivityLevel.Sedentary;
        const DietGoal goal = DietGoal.Cut;
        const int aggressiveDeficitPct = 35;

        // Act
        var result = MacroCalculator.Calculate(
            age, gender, weightKg, heightCm, activity, goal,
            deficitPercentage: aggressiveDeficitPct);

        // Assert
        // BMR = (10 * 55) + (6.25 * 160) - (5 * 30) - 161 = 550 + 1000 - 150 - 161 = 1239 kcal
        result.BmrCalories.Should().Be(1239);

        // TDEE = 1239 * 1.2 = 1486.8 -> 1487 kcal
        // Cel (-35%): 1487 * 0.65 = 966.55 kcal -> ogranicznik min 1100 kcal
        // 1100 kcal < 1239 BMR -> IsBelowBmr MUSI być true!
        result.TargetCalories.Should().BeLessThan(result.BmrCalories);
        result.IsBelowBmr.Should().BeTrue();
    }

    [Fact]
    public void Calculate_PhysicalWorkActivityLevel_UsesMultiplier1Point6()
    {
        // Arrange (Dedykowany poziom aktywności dla pracowników fizycznych: PAL = 1.6)
        const int age = 28;
        const Gender gender = Gender.Male;
        const decimal weightKg = 85m;
        const decimal heightCm = 182m;

        // Act
        var result = MacroCalculator.Calculate(
            age, gender, weightKg, heightCm,
            ActivityLevel.PhysicalWork,
            DietGoal.Maintain);

        // Assert
        // BMR = (10 * 85) + (6.25 * 182) - (5 * 28) + 5 = 850 + 1137.5 - 140 + 5 = 1852.5 kcal
        // TDEE = 1852.5 * 1.6 = 2964 kcal
        result.TdeeCalories.Should().Be(2964);
    }

    [Theory]
    [InlineData(ActivityLevel.Sedentary, 1.2)]
    [InlineData(ActivityLevel.LightlyActive, 1.375)]
    [InlineData(ActivityLevel.ModeratelyActive, 1.55)]
    [InlineData(ActivityLevel.PhysicalWork, 1.6)]
    [InlineData(ActivityLevel.VeryActive, 1.725)]
    [InlineData(ActivityLevel.ExtraActive, 1.9)]
    public void Calculate_AllActivityLevels_MultipliesBmrCorrectly(ActivityLevel level, decimal expectedMultiplier)
    {
        // Arrange
        const int age = 20;
        const Gender gender = Gender.Male;
        const decimal weightKg = 70m;
        const decimal heightCm = 170m;

        // Act
        var result = MacroCalculator.Calculate(age, gender, weightKg, heightCm, level, DietGoal.Maintain);

        // Assert
        // BMR raw = (10*70) + (6.25*170) - (5*20) + 5 = 700 + 1062.5 - 100 + 5 = 1667.5 kcal
        var expectedTdee = (int)Math.Round(1667.5m * expectedMultiplier);
        result.TdeeCalories.Should().Be(expectedTdee);
    }

    [Fact]
    public void Calculate_BulkGoalWithDefaultSettings_Adds12PercentSurplus()
    {
        // Arrange
        const int age = 22;
        const Gender gender = Gender.Male;
        const decimal weightKg = 75m;
        const decimal heightCm = 178m;
        const ActivityLevel activity = ActivityLevel.ModeratelyActive;

        // Act
        var result = MacroCalculator.Calculate(age, gender, weightKg, heightCm, activity, DietGoal.Bulk);

        // Assert
        result.TargetCalories.Should().BeGreaterThan(result.TdeeCalories);
        result.DeficitCalories.Should().BeGreaterThan(0); // w modelu oznacza nadwyżkę dla Bulk
        result.IsBelowBmr.Should().BeFalse();
    }

    [Fact]
    public void Calculate_MaintainGoal_SetsTargetCaloriesEqualToTdee()
    {
        // Arrange
        const int age = 35;
        const Gender gender = Gender.Female;
        const decimal weightKg = 65m;
        const decimal heightCm = 170m;
        const ActivityLevel activity = ActivityLevel.LightlyActive;

        // Act
        var result = MacroCalculator.Calculate(age, gender, weightKg, heightCm, activity, DietGoal.Maintain);

        // Assert
        result.TargetCalories.Should().Be(result.TdeeCalories);
        result.DeficitCalories.Should().BeNull();
        result.WeeklyChangeKg.Should().BeNull();
    }
}

