using FluentAssertions;
using MacroGuard.Domain.Entities;
using MacroGuard.Domain.Enums;
using Xunit;

namespace MacroGuard.UnitTests;

/// <summary>
/// Testy jednostkowe przeliczania wartości odżywczych (kalorie, białko, węglowodany, tłuszcze)
/// na zadaną wagę porcji (w gramach lub mililitrach).
/// Pokrywają przypadki testowe: TC-DIARY-001 oraz TC-DIARY-002 z TEST_CASES.md.
/// </summary>
public class MealEntryNutritionTests
{
    [Fact]
    public void CalculatedNutrients_150gEgg_MatchesExactValuesInTcDiary001()
    {
        // Arrange (Warunki z TC-DIARY-001: Jajko kurze całe 143 kcal, B: 12.6g, W: 0.7g, T: 9.5g na 100g)
        var egg = new FoodItem
        {
            Name = "Jajko kurze całe (1 szt. ~ 55g) (Wiejskie)",
            CaloriesPer100g = 143m,
            ProteinPer100g = 12.6m,
            CarbsPer100g = 0.7m,
            FatPer100g = 9.5m
        };

        var entry = new MealEntry
        {
            FoodItem = egg,
            FoodItemId = egg.Id,
            MealType = MealType.Breakfast,
            WeightGrams = 150m
        };

        // Act & Assert
        // Kalorie: 143 * 1.5 = 214.5 kcal
        entry.CalculatedCalories.Should().Be(214.5m);

        // Białko: 12.6 * 1.5 = 18.9 g
        entry.CalculatedProtein.Should().Be(18.9m);

        // Węglowodany: 0.7 * 1.5 = 1.05 -> zaokrąglone do 1.0 lub 1.1 g
        entry.CalculatedCarbs.Should().BeApproximately(1.05m, 0.1m);

        // Tłuszcz: 9.5 * 1.5 = 14.25 -> 14.2 lub 14.3 g
        entry.CalculatedFat.Should().BeApproximately(14.25m, 0.1m);
    }

    [Fact]
    public void CalculatedNutrients_BeverageVolume330ml_MatchesExactValuesInTcDiary002()
    {
        // Arrange (Warunki z TC-DIARY-002: Puszka Coca-Coli 330 ml, 42 kcal, W: 10.6g na 100ml)
        var cola = new FoodItem
        {
            Name = "Coca-Cola Original",
            Category = "Napoje i Płyny",
            CaloriesPer100g = 42m,
            ProteinPer100g = 0m,
            CarbsPer100g = 10.6m,
            FatPer100g = 0m
        };

        var entry = new MealEntry
        {
            FoodItem = cola,
            FoodItemId = cola.Id,
            MealType = MealType.Lunch,
            WeightGrams = 330m // 330 ml
        };

        // Act & Assert
        // Kalorie: 42 * 3.3 = 138.6 kcal
        entry.CalculatedCalories.Should().Be(138.6m);

        // Węglowodany: 10.6 * 3.3 = 34.98 -> 35.0 g
        entry.CalculatedCarbs.Should().Be(35.0m);
        entry.CalculatedProtein.Should().Be(0m);
        entry.CalculatedFat.Should().Be(0m);
    }

    [Fact]
    public void CalculatedNutrients_NullFoodItem_ReturnsZeroSafelyWithoutNullReferenceException()
    {
        // Arrange
        var entry = new MealEntry
        {
            FoodItem = null,
            WeightGrams = 100m
        };

        // Act & Assert (Ochrona przed NullReferenceException)
        entry.CalculatedCalories.Should().Be(0m);
        entry.CalculatedProtein.Should().Be(0m);
        entry.CalculatedCarbs.Should().Be(0m);
        entry.CalculatedFat.Should().Be(0m);
    }

    [Theory]
    [InlineData(50, 50.0)]
    [InlineData(100, 100.0)]
    [InlineData(200, 200.0)]
    [InlineData(250, 250.0)]
    public void CalculatedNutrients_VariousPortionSizes_ScalesProportionally(decimal grams, decimal expectedCalories)
    {
        // Arrange (Produkt o bazie 100 kcal / 100g)
        var standardFood = new FoodItem
        {
            Name = "Produkt wzorcowy 100kcal",
            CaloriesPer100g = 100m,
            ProteinPer100g = 10m,
            CarbsPer100g = 10m,
            FatPer100g = 2m
        };

        var entry = new MealEntry
        {
            FoodItem = standardFood,
            WeightGrams = grams
        };

        // Act & Assert
        entry.CalculatedCalories.Should().Be(expectedCalories);
    }
}

