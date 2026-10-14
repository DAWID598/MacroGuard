using MacroGuard.Application.DTOs;
using MacroGuard.Application.Interfaces;
using MacroGuard.Domain.Entities;
using MacroGuard.Domain.Services;
using MacroGuard.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace MacroGuard.Infrastructure.Services;

public class ProfileService(MacroGuardDbContext dbContext) : IProfileService
{
    public async Task<UserProfileDto> GetProfileAsync(Guid userId, CancellationToken ct = default)
    {
        var profile = await dbContext.UserProfiles.FirstOrDefaultAsync(x => x.UserId == userId, ct);
        if (profile is null)
        {
            profile = new UserProfile { UserId = userId };
            dbContext.UserProfiles.Add(profile);
            await dbContext.SaveChangesAsync(ct);
        }

        return MapToDto(profile);
    }

    public async Task<UserProfileDto> CalculateAndSaveProfileAsync(Guid userId, CalculateProfileRequest request, CancellationToken ct = default)
    {
        var profile = await dbContext.UserProfiles.FirstOrDefaultAsync(x => x.UserId == userId, ct);
        if (profile is null)
        {
            profile = new UserProfile { UserId = userId };
            dbContext.UserProfiles.Add(profile);
        }

        var calc = MacroCalculator.Calculate(
            request.Age,
            request.Gender,
            request.WeightKg,
            request.HeightCm,
            request.ActivityLevel,
            request.Goal,
            request.TargetWeightKg,
            request.DeficitPercentage,
            request.WeeklyChangeKg
        );

        profile.Age = request.Age;
        profile.Gender = request.Gender;
        profile.WeightKg = request.WeightKg;
        profile.HeightCm = request.HeightCm;
        profile.ActivityLevel = request.ActivityLevel;
        profile.Goal = request.Goal;
        profile.TargetWeightKg = request.TargetWeightKg;
        profile.DeficitPercentage = request.DeficitPercentage;
        profile.WeeklyChangeKg = request.WeeklyChangeKg;
        profile.BmrCalories = calc.BmrCalories;
        profile.TdeeCalories = calc.TdeeCalories;
        profile.TargetCalories = request.CustomCalories ?? calc.TargetCalories;
        profile.TargetProteinGrams = request.CustomProteinGrams ?? calc.TargetProteinGrams;
        profile.TargetCarbsGrams = request.CustomCarbsGrams ?? calc.TargetCarbsGrams;
        profile.TargetFatGrams = request.CustomFatGrams ?? calc.TargetFatGrams;
        profile.UpdatedAtUtc = DateTime.UtcNow;

        await dbContext.SaveChangesAsync(ct);
        return MapToDto(profile, calc);
    }

    private static UserProfileDto MapToDto(UserProfile p, MacroCalculationResult? calc = null)
    {
        calc ??= MacroCalculator.Calculate(
            p.Age,
            p.Gender,
            p.WeightKg,
            p.HeightCm,
            p.ActivityLevel,
            p.Goal,
            p.TargetWeightKg,
            p.DeficitPercentage,
            p.WeeklyChangeKg
        );

        return new(
            p.Id,
            p.Age,
            p.Gender,
            p.WeightKg,
            p.HeightCm,
            p.ActivityLevel,
            p.Goal,
            p.BmrCalories,
            p.TdeeCalories,
            p.TargetCalories,
            p.TargetProteinGrams,
            p.TargetCarbsGrams,
            p.TargetFatGrams,
            p.TargetWeightKg,
            p.DeficitPercentage,
            p.WeeklyChangeKg ?? calc.WeeklyChangeKg,
            calc.WeightDifferenceKg,
            calc.DeficitCalories,
            calc.EstimatedWeeks,
            calc.IsBelowBmr
        );
    }
}

