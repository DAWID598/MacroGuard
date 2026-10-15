using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using MacroGuard.Application.DTOs;
using MacroGuard.Application.Exceptions;
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
using MacroGuard.Infrastructure.Security;

namespace MacroGuard.Infrastructure.Services;

public class AuthService(
    UserManager<ApplicationUser> userManager,
    MacroGuardDbContext dbContext,
    IConfiguration configuration,
    IJwtKeyProvider jwtKeyProvider,
    ILogger<AuthService> logger,
    IEmailSender emailSender) : IAuthService
{
    public async Task<RegisterResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default)
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
            EmailConfirmed = false,
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

        // Generowanie tokena weryfikacyjnego i wysyłka wiadomości e-mail
        var emailToken = await userManager.GenerateEmailConfirmationTokenAsync(user);
        var clientBaseUrl = configuration["ClientUrl"] ?? "http://localhost:4200";
        var confirmLink = $"{clientBaseUrl}/auth?tab=confirm-email&email={Uri.EscapeDataString(user.Email!)}&token={Uri.EscapeDataString(emailToken)}";

        await SendActivationEmailAsync(user, confirmLink, ct);

        logger.LogInformation("Konto {Email} zostało utworzone. Wysłano wiadomość z linkiem aktywacyjnym.", user.Email);

        // [VULN Fix]: Nie generujemy i nie zwracamy tokenu JWT przed weryfikacją adresu e-mail!
        return new RegisterResponse(
            "Konto zostało pomyślnie utworzone! Wysłaliśmy wiadomość e-mail z linkiem aktywacyjnym. Potwierdź swój adres e-mail przed pierwszym zalogowaniem.",
            user.Email!,
            RequiresEmailConfirmation: true
        );
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null)
        {
            // Nie ujawniamy czy użytkownik istnieje w bazie (zapobieganie user enumeration)
            throw new UnauthorizedAccessException("Nieprawidłowy adres e-mail lub hasło.");
        }

        // 1. Sprawdź, czy konto jest aktualnie zablokowane
        if (await userManager.IsLockedOutAsync(user))
        {
            var lockoutEnd = await userManager.GetLockoutEndDateAsync(user);
            var remainingMinutes = lockoutEnd.HasValue 
                ? Math.Max(1, (int)Math.Ceiling((lockoutEnd.Value - DateTimeOffset.UtcNow).TotalMinutes)) 
                : 5;

            logger.LogWarning("Zablokowano próbę logowania na zablokowane konto: {Email}. Pozostało minut: {Minutes}", user.Email, remainingMinutes);
            throw new AccountLockedException($"Konto zostało tymczasowo zablokowane z powodu 5 nieudanych prób logowania. Spróbuj ponownie za {remainingMinutes} min.");
        }

        // Upewnij się, że Lockout jest włączony dla konta
        if (!user.LockoutEnabled)
        {
            await userManager.SetLockoutEnabledAsync(user, true);
        }

        // 2. Weryfikacja hasła
        var isPasswordValid = await userManager.CheckPasswordAsync(user, request.Password);
        if (!isPasswordValid)
        {
            // Zwiększ licznik nieudanych prób logowania w ASP.NET Core Identity
            await userManager.AccessFailedAsync(user);

            if (await userManager.IsLockedOutAsync(user))
            {
                logger.LogWarning("Konto {Email} osiągnęło limit 5 nieudanych prób i zostało zablokowane na 5 minut.", user.Email);
                throw new AccountLockedException("Konto zostało zablokowane na 5 minut z powodu 5 nieudanych prób logowania. Spróbuj ponownie później.");
            }

            var failedCount = await userManager.GetAccessFailedCountAsync(user);
            var remaining = 5 - failedCount;
            logger.LogWarning("Błędne hasło dla konta {Email}. Licznik nieudanych prób: {FailedCount}/5.", user.Email, failedCount);

            if (remaining > 0 && remaining <= 2)
            {
                throw new UnauthorizedAccessException($"Nieprawidłowy adres e-mail lub hasło. Uwaga: pozostała {remaining} próba przed blokadą konta na 5 minut.");
            }

            throw new UnauthorizedAccessException("Nieprawidłowy adres e-mail lub hasło.");
        }

        // 3. Po udanym zweryfikowaniu hasła resetujemy licznik nieudanych prób
        await userManager.ResetAccessFailedCountAsync(user);

        // 4. Wymóg weryfikacji adresu e-mail [VULN Fix]:
        if (!await userManager.IsEmailConfirmedAsync(user))
        {
            logger.LogWarning("Próba zalogowania na niepotwierdzone konto e-mail: {Email}", user.Email);
            throw new EmailNotConfirmedException(
                "Adres e-mail nie został jeszcze aktywowany. Sprawdź swoją skrzynkę pocztową i kliknij w link aktywacyjny.",
                user.Email
            );
        }

        var token = GenerateJwtToken(user);
        return new AuthResponse(token, user.Id, user.Email!, user.DisplayName);
    }

    public async Task<bool> ConfirmEmailAsync(ConfirmEmailRequest request, CancellationToken ct = default)
    {
        var user = await userManager.FindByEmailAsync(request.Email)
            ?? throw new KeyNotFoundException("Nie znaleziono użytkownika o podanym adresie e-mail.");

        if (user.EmailConfirmed)
        {
            return true;
        }

        var result = await userManager.ConfirmEmailAsync(user, request.Token);
        if (!result.Succeeded)
        {
            var errors = string.Join(" ", result.Errors.Select(e => e.Description));
            logger.LogWarning("Nieudana próba aktywacji konta {Email}: {Errors}", request.Email, errors);
            throw new InvalidOperationException("Link aktywacyjny jest nieprawidłowy lub wygasł. Poproś o wygenerowanie nowego linku.");
        }

        logger.LogInformation("Konto {Email} zostało pomyślnie aktywowane (e-mail zweryfikowany).", user.Email);
        return true;
    }

    public async Task<string> ResendConfirmationEmailAsync(ResendConfirmationEmailRequest request, CancellationToken ct = default)
    {
        var user = await userManager.FindByEmailAsync(request.Email);
        if (user is null)
        {
            // Ochrona przed user enumeration: nie ujawniamy istnienia konta
            return "Jeśli podany adres e-mail istnieje w bazie i nie został jeszcze aktywowany, wysłaliśmy nowy link aktywacyjny.";
        }

        if (user.EmailConfirmed)
        {
            return "Ten adres e-mail został już wcześniej potwierdzony. Możesz się zalogować.";
        }

        var emailToken = await userManager.GenerateEmailConfirmationTokenAsync(user);
        var clientBaseUrl = configuration["ClientUrl"] ?? "http://localhost:4200";
        var confirmLink = $"{clientBaseUrl}/auth?tab=confirm-email&email={Uri.EscapeDataString(user.Email!)}&token={Uri.EscapeDataString(emailToken)}";

        await SendActivationEmailAsync(user, confirmLink, ct);

        logger.LogInformation("Wysłano ponownie e-mail aktywacyjny na konto: {Email}", user.Email);
        return "Wysłaliśmy nowy link aktywacyjny na Twój adres e-mail. Sprawdź swoją skrzynkę pocztową.";
    }

    private async Task SendActivationEmailAsync(ApplicationUser user, string confirmLink, CancellationToken ct)
    {
        var emailBody = $@"
            <div style=""font-family: Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;"">
                <div style=""text-align: center; margin-bottom: 20px;"">
                    <h2 style=""color: #3f51b5; margin: 0;"">MacroGuard 🥗💪</h2>
                    <p style=""color: #64748b; font-size: 14px; margin: 4px 0 0;"">Twój inteligentny dziennik żywieniowy</p>
                </div>
                <p>Cześć <strong>{user.DisplayName}</strong>,</p>
                <p>Dziękujemy za rejestrację w serwisie MacroGuard!</p>
                <p>Aby aktywować swoje konto i rozpocząć korzystanie z dziennika oraz kalkulatora makroskładników, potwierdź swój adres e-mail klikając w poniższy przycisk:</p>
                <p style=""text-align: center; margin: 30px 0;"">
                    <a href=""{confirmLink}"" style=""background-color: #3f51b5; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 15px;"">
                        Potwierdź adres e-mail
                    </a>
                </p>
                <p style=""color: #64748b; font-size: 13px; line-height: 1.5;"">
                    Jeśli przycisk nie działa, skopiuj i wklej poniższy link w oknie przeglądarki:<br/>
                    <a href=""{confirmLink}"" style=""color: #3f51b5; word-break: break-all;"">{confirmLink}</a>
                </p>
                <hr style=""border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;"" />
                <p style=""color: #94a3b8; font-size: 12px; margin: 0;"">
                    Jeśli to nie Ty zakładałeś konto w MacroGuard, zignoruj tę wiadomość.
                </p>
            </div>";

        await emailSender.SendEmailAsync(
            user.Email!,
            "MacroGuard — Aktywuj swoje konto (potwierdzenie adresu e-mail)",
            emailBody,
            ct
        );
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

        // Zresetuj ewentualną blokadę konta i licznik nieudanych prób po poprawnym zresetowaniu hasła
        await userManager.SetLockoutEndDateAsync(user, null);
        await userManager.ResetAccessFailedCountAsync(user);

        logger.LogInformation("Hasło użytkownika {Email} zostało pomyślnie zresetowane.", user.Email);
        return true;
    }

    private string GenerateJwtToken(ApplicationUser user)
    {
        var jwtKey = jwtKeyProvider.GetSigningKey();
        var jwtIssuer = jwtKeyProvider.GetIssuer();
        var jwtAudience = jwtKeyProvider.GetAudience();

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

