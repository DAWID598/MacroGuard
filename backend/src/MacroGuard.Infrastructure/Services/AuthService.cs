using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using MacroGuard.Application.DTOs;
using MacroGuard.Application.Interfaces;
using MacroGuard.Domain.Entities;
using MacroGuard.Domain.Enums;
using MacroGuard.Domain.Services;
using MacroGuard.Infrastructure.Identity;
using MacroGuard.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;

namespace MacroGuard.Infrastructure.Services;

public class AuthService(
    UserManager<ApplicationUser> userManager,
    MacroGuardDbContext dbContext,
    IConfiguration configuration) : IAuthService
{
    public async Task<AuthResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default)
    {
        var existingUser = await userManager.FindByEmailAsync(request.Email);
        if (existingUser is not null)
        {
            throw new InvalidOperationException("Użytkownik z tym adresem e-mail już istnieje.");
        }

        var user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = request.Email,
            Email = request.Email,
            DisplayName = request.DisplayName.Trim()
        };

        var result = await userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            var errors = string.Join(" ", result.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Nie udało się utworzyć konta: {errors}");
        }

        // Utworzenie domyślnego profilu użytkownika z wyliczonym BMR/TDEE
        var calc = MacroCalculator.Calculate(25, Gender.Male, 75m, 178m, ActivityLevel.ModeratelyActive, DietGoal.Maintain);
        var defaultProfile = new UserProfile
        {
            UserId = user.Id,
            Age = 25,
            Gender = Gender.Male,
            WeightKg = 75m,
            HeightCm = 178m,
            ActivityLevel = ActivityLevel.ModeratelyActive,
            Goal = DietGoal.Maintain,
            BmrCalories = calc.BmrCalories,
            TdeeCalories = calc.TdeeCalories,
            TargetCalories = calc.TargetCalories,
            TargetProteinGrams = calc.TargetProteinGrams,
            TargetCarbsGrams = calc.TargetCarbsGrams,
            TargetFatGrams = calc.TargetFatGrams
        };

        dbContext.UserProfiles.Add(defaultProfile);
        await dbContext.SaveChangesAsync(ct);

        var token = GenerateJwtToken(user);
        return new AuthResponse(token, user.Id, user.Email!, user.DisplayName);
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null || !await userManager.CheckPasswordAsync(user, request.Password))
        {
            throw new UnauthorizedAccessException("Nieprawidłowy adres e-mail lub hasło.");
        }

        var token = GenerateJwtToken(user);
        return new AuthResponse(token, user.Id, user.Email!, user.DisplayName);
    }

    private string GenerateJwtToken(ApplicationUser user)
    {
        var jwtKey = configuration["Jwt:Key"] ?? "MacroGuard_SuperSecretDevelopmentKey_2026_AtLeast32Bytes!";
        var jwtIssuer = configuration["Jwt:Issuer"] ?? "MacroGuard.Api";
        var jwtAudience = configuration["Jwt:Audience"] ?? "MacroGuard.Client";

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new("displayName", user.DisplayName)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}

