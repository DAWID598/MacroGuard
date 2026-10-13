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

using Microsoft.Extensions.Logging;

namespace MacroGuard.Infrastructure.Services;

public class AuthService(
    UserManager<ApplicationUser> userManager,
    MacroGuardDbContext dbContext,
    IConfiguration configuration,
    ILogger<AuthService> logger,
    IEmailSender emailSender) : IAuthService
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

    public async Task<ForgotPasswordResponse> ForgotPasswordAsync(ForgotPasswordRequest request, CancellationToken ct = default)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null)
        {
            // Ze względów bezpieczeństwa nie ujawniamy czy e-mail istnieje
            return new ForgotPasswordResponse("Jeśli podany adres e-mail istnieje w bazie, wysłano wiadomość z instrukcją resetowania hasła.");
        }

        var resetToken = await userManager.GeneratePasswordResetTokenAsync(user);
        var clientBaseUrl = configuration["ClientUrl"] ?? "http://localhost:4200";
        var resetLink = $"{clientBaseUrl}/auth?tab=reset&email={Uri.EscapeDataString(user.Email!)}&token={Uri.EscapeDataString(resetToken)}";

        var emailBody = $@"
            <div style=""font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;"">
                <div style=""text-align: center; margin-bottom: 20px;"">
                    <h2 style=""color: #3f51b5; margin: 0;"">MacroGuard 🥗💪</h2>
                    <p style=""color: #64748b; font-size: 14px; margin: 4px 0 0;"">Twój inteligentny dziennik żywieniowy</p>
                </div>
                <p>Cześć <strong>{user.DisplayName}</strong>,</p>
                <p>Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta w MacroGuard.</p>
                <p>Aby utworzyć nowe hasło, kliknij poniższy przycisk:</p>
                <p style=""text-align: center; margin: 30px 0;"">
                    <a href=""{resetLink}"" style=""background-color: #3f51b5; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 15px;"">
                        Zresetuj hasło
                    </a>
                </p>
                <p style=""color: #64748b; font-size: 13px; line-height: 1.5;"">
                    Jeśli przycisk nie działa, skopiuj i wklej poniższy link w oknie przeglądarki:<br/>
                    <a href=""{resetLink}"" style=""color: #3f51b5; word-break: break-all;"">{resetLink}</a>
                </p>
                <hr style=""border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;"" />
                <p style=""color: #94a3b8; font-size: 12px; margin: 0;"">
                    Jeśli to nie Ty prosiłeś o zmianę hasła, zignoruj tę wiadomość — Twoje obecne hasło pozostanie bezpieczne.
                </p>
            </div>";

        await emailSender.SendEmailAsync(
            user.Email!,
            "MacroGuard — Resetowanie hasła do Twojego konta",
            emailBody,
            ct
        );

        return new ForgotPasswordResponse("Wysłaliśmy wiadomość e-mail z linkiem do zresetowania hasła. Sprawdź swoją skrzynkę pocztową.");
    }

    public async Task<bool> ResetPasswordAsync(ResetPasswordRequest request, CancellationToken ct = default)
    {
        var user = await userManager.FindByEmailAsync(request.Email)
            ?? throw new KeyNotFoundException("Nie znaleziono użytkownika o podanym adresie e-mail.");

        var result = await userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);
        if (!result.Succeeded)
        {
            var errors = string.Join(" ", result.Errors.Select(e => e.Description));
            throw new InvalidOperationException($"Nie udało się zresetować hasła: {errors}");
        }

        logger.LogInformation("Hasło użytkownika {Email} zostało pomyślnie zresetowane.", user.Email);
        return true;
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

