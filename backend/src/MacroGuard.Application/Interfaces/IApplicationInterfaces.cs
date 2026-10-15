using MacroGuard.Application.DTOs;
using MacroGuard.Domain.Enums;

namespace MacroGuard.Application.Interfaces;

public interface IAuthService
{
    Task<RegisterResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default);
    Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default);
    Task<bool> ConfirmEmailAsync(ConfirmEmailRequest request, CancellationToken ct = default);
    Task<string> ResendConfirmationEmailAsync(ResendConfirmationEmailRequest request, CancellationToken ct = default);
    Task<ForgotPasswordResponse> ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken ct = default);
    Task<bool> ResetPasswordAsync(ResetPasswordRequest request, CancellationToken ct = default);
}

public interface IProfileService
{
    Task<UserProfileDto> GetProfileAsync(Guid userId, CancellationToken ct = default);
    Task<UserProfileDto> CalculateAndSaveProfileAsync(Guid userId, CalculateProfileRequest request, CancellationToken ct = default);
}

public interface IFoodService
{
    Task<List<FoodItemDto>> SearchFoodsAsync(Guid userId, string? query, string? category, CancellationToken ct = default);
    Task<FoodItemDto> CreateFoodAsync(Guid userId, CreateFoodItemRequest request, CancellationToken ct = default);
}

public interface IDiaryService
{
    Task<DailyDiaryDto> GetDailyDiaryAsync(Guid userId, DateOnly date, CancellationToken ct = default);
    Task<MealEntryDto> AddMealEntryAsync(Guid userId, AddMealEntryRequest request, CancellationToken ct = default);
    Task<bool> DeleteMealEntryAsync(Guid userId, Guid entryId, CancellationToken ct = default);
    Task<int> ClearMealAsync(Guid userId, DateOnly date, MealType mealType, CancellationToken ct = default);
    Task<CopyResultDto> CopyMealAsync(Guid userId, CopyMealRequest request, CancellationToken ct = default);
    Task<CopyResultDto> CopyDayAsync(Guid userId, CopyDayRequest request, CancellationToken ct = default);
}

