using System.ComponentModel.DataAnnotations;
using System.Reflection;
using FluentAssertions;
using MacroGuard.Application.DTOs;
using MacroGuard.Domain.Enums;
using Xunit;

namespace MacroGuard.UnitTests;

/// <summary>
/// Testy jednostkowe walidacji reguł biznesowych (Data Annotations / BVA / EP).
/// Pokrywają:
/// - Weryfikację załatanego defektu BUG-005 (odrzucenie ujemnych lub zerowych gramatur)
/// - Przypadek TC-AUTH-002 (walidacja złożoności hasła rejestracji)
/// </summary>
public class ValidationAttributesTests
{
    private static IList<ValidationResult> ValidateModel(object model)
    {
        var validationResults = new List<ValidationResult>();
        var type = model.GetType();

        // 1. Sprawdź właściwości
        var ctx = new ValidationContext(model);
        Validator.TryValidateObject(model, ctx, validationResults, validateAllProperties: true);

        // 2. Dla rekordów z atrybutami na parametrach konstruktora (ASP.NET Core Model Binding)
        var ctor = type.GetConstructors().FirstOrDefault();
        if (ctor != null)
        {
            foreach (var param in ctor.GetParameters())
            {
                var prop = type.GetProperty(param.Name!, BindingFlags.Public | BindingFlags.Instance | BindingFlags.IgnoreCase);
                var val = prop?.GetValue(model);
                var paramCtx = new ValidationContext(model) { MemberName = param.Name };

                foreach (var attr in param.GetCustomAttributes<ValidationAttribute>())
                {
                    var result = attr.GetValidationResult(val, paramCtx);
                    if (result != null && result != ValidationResult.Success)
                    {
                        validationResults.Add(result);
                    }
                }
            }
        }

        return validationResults;
    }

    [Theory]
    [InlineData(-100)]
    [InlineData(-1)]
    [InlineData(0)]
    public void AddMealEntryRequest_NegativeOrZeroGrams_FailsValidationAccordingToBug005(decimal invalidGrams)
    {
        // Arrange (Symulacja błędu BUG-005: próba dodania ujemnej lub zerowej wagi)
        var request = new AddMealEntryRequest(
            FoodItemId: Guid.NewGuid(),
            ConsumedDate: DateOnly.FromDateTime(DateTime.Today),
            MealType: MealType.Breakfast,
            WeightGrams: invalidGrams
        );

        // Act
        var results = ValidateModel(request);

        // Assert
        results.Should().NotBeEmpty(because: "Waga porcji <= 0 nie może być zaakceptowana (BUG-005)");
        results.Should().Contain(r => r.MemberNames.Contains(nameof(AddMealEntryRequest.WeightGrams)));
    }

    [Theory]
    [InlineData(1)]      // Dokładna dolna granica BVA
    [InlineData(150)]    // Typowa porcja ze środka klasy równoważności
    [InlineData(5000)]   // Dokładna górna granica BVA
    public void AddMealEntryRequest_ValidPortionGrams_PassesValidationSuccessfully(decimal validGrams)
    {
        // Arrange
        var request = new AddMealEntryRequest(
            FoodItemId: Guid.NewGuid(),
            ConsumedDate: DateOnly.FromDateTime(DateTime.Today),
            MealType: MealType.Lunch,
            WeightGrams: validGrams
        );

        // Act
        var results = ValidateModel(request);

        // Assert
        results.Should().BeEmpty();
    }

    [Fact]
    public void AddMealEntryRequest_ExceedingMaximum5000Grams_FailsValidation()
    {
        // Arrange (Wartość tuż powyżej dopuszczalnego limitu BVA: 5001g)
        var request = new AddMealEntryRequest(
            FoodItemId: Guid.NewGuid(),
            ConsumedDate: DateOnly.FromDateTime(DateTime.Today),
            MealType: MealType.Dinner,
            WeightGrams: 5001m
        );

        // Act
        var results = ValidateModel(request);

        // Assert
        results.Should().NotBeEmpty();
        results.Should().Contain(r => r.MemberNames.Contains(nameof(AddMealEntryRequest.WeightGrams)));
    }

    [Fact]
    public void RegisterRequest_ValidComplexPassword_PassesValidationAccordingToTcAuth001()
    {
        // Arrange (Hasło spełniające wszystkie kryteria: min 10 znaków, wielka/mała litera, cyfra, znak specjalny)
        var request = new RegisterRequest(
            Email: "jan.nowak@example.com",
            Password: "MacroGuard2026!",
            DisplayName: "Jan Nowak"
        );

        // Act
        var results = ValidateModel(request);

        // Assert
        results.Should().BeEmpty();
    }

    [Theory]
    [InlineData("Abc12345!")]         // 9 znaków - poniżej granicy 10 znaków (BVA / TC-AUTH-002)
    [InlineData("macroguard2026!")]    // Brak wielkiej litery (EP - KN2)
    [InlineData("MACROGUARD2026!")]    // Brak małej litery (EP)
    [InlineData("MacroGuardPass!")]    // Brak cyfry (EP - KN3)
    [InlineData("MacroGuard2026Pass")] // Brak znaku specjalnego (EP - KN4)
    public void RegisterRequest_InvalidPasswordComplexity_FailsValidationAccordingToTcAuth002(string invalidPassword)
    {
        // Arrange (Warunki z TC-AUTH-002: weryfikacja klas niepoprawnych polityki haseł)
        var request = new RegisterRequest(
            Email: "test@example.com",
            Password: invalidPassword,
            DisplayName: "Tester"
        );

        // Act
        var results = ValidateModel(request);

        // Assert
        results.Should().NotBeEmpty();
        results.Should().Contain(r => r.MemberNames.Contains(nameof(RegisterRequest.Password)));
    }
}
