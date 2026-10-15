using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace MacroGuard.Infrastructure.Security;

public interface IJwtKeyProvider
{
    string GetSigningKey();
    string GetIssuer();
    string GetAudience();
}

public class JwtKeyProvider : IJwtKeyProvider
{
    private readonly string _signingKey;
    private readonly string _issuer;
    private readonly string _audience;

    public JwtKeyProvider(IConfiguration configuration, IHostEnvironment? environment = null)
    {
        _issuer = configuration["Jwt:Issuer"] ?? "MacroGuard.Api";
        _audience = configuration["Jwt:Audience"] ?? "MacroGuard.Client";
        _signingKey = ResolveSigningKey(configuration, environment);
    }

    public string GetSigningKey() => _signingKey;
    public string GetIssuer() => _issuer;
    public string GetAudience() => _audience;

    public static string ResolveSigningKey(IConfiguration configuration, IHostEnvironment? environment = null)
    {
        // 1. Sprawdź konfigurację (appsettings, user-secrets, zmienne środowiskowe Jwt__Key)
        var key = configuration["Jwt:Key"];

        // 2. Sprawdź bezpośrednie zmienne środowiskowe (często używane w Docker/K8s/CI)
        if (string.IsNullOrWhiteSpace(key))
        {
            key = Environment.GetEnvironmentVariable("JWT_SECRET_KEY")
                ?? Environment.GetEnvironmentVariable("MACROGUARD_JWT_KEY")
                ?? Environment.GetEnvironmentVariable("Jwt__Key");
        }

        // 3. Jeśli klucz został jawnie podany, zweryfikuj jego jakość kryptograficzną
        if (!string.IsNullOrWhiteSpace(key))
        {
            if (Encoding.UTF8.GetByteCount(key) < 32)
            {
                throw new InvalidOperationException(
                    "BŁĄD KONFIGURACJI: Klucz podpisu JWT ('Jwt:Key') jest zbyt krótki. Wymagane jest minimum 32 bajty (256 bitów) dla algorytmu HMAC-SHA256.");
            }

            var envName = environment?.EnvironmentName 
                ?? configuration["ASPNETCORE_ENVIRONMENT"] 
                ?? Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
            var isProduction = string.Equals(envName, "Production", StringComparison.OrdinalIgnoreCase);

            // Zabezpieczenie przed znanym, przykładowym kluczem z audytu
            if (isProduction && key.Contains("SuperSecretDevelopmentKey", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "KRYTYCZNY BŁĄD BEZPIECZEŃSTWA [VULN-001]: Wykryto użycie domyślnego/przykładowego klucza deweloperskiego na produkcji! " +
                    "Skonfiguruj unikalny, silny klucz produkcyjny w zmiennej środowiskowej 'Jwt__Key' lub 'JWT_SECRET_KEY'.");
            }

            return key;
        }

        // 4. W środowisku produkcyjnym bezwzględnie zabroń startu bez skonfigurowanego klucza
        {
            var envName = environment?.EnvironmentName 
                ?? configuration["ASPNETCORE_ENVIRONMENT"] 
                ?? Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT");
            var isProduction = string.Equals(envName, "Production", StringComparison.OrdinalIgnoreCase);

            if (isProduction)
            {
                throw new InvalidOperationException(
                    "KRYTYCZNY BŁĄD KONFIGURACJI [VULN-001]: Klucz podpisu JWT nie został skonfigurowany w środowisku produkcyjnym! " +
                    "Należy przekazać klucz o długości co najmniej 32 znaków za pomocą zmiennej środowiskowej 'Jwt__Key' lub 'JWT_SECRET_KEY'.");
            }
        }

        // 5. W środowisku deweloperskim: pobierz lub wygeneruj unikalny dla danej maszyny klucz 256-bit
        return GetOrCreateDevelopmentKey();
    }

    private static string GetOrCreateDevelopmentKey()
    {
        const string devKeyFile = ".dev-jwt.key";
        try
        {
            if (File.Exists(devKeyFile))
            {
                var existingKey = File.ReadAllText(devKeyFile).Trim();
                if (Encoding.UTF8.GetByteCount(existingKey) >= 32)
                {
                    return existingKey;
                }
            }

            var randomBytes = new byte[32];
            RandomNumberGenerator.Fill(randomBytes);
            var generatedKey = Convert.ToBase64String(randomBytes);
            File.WriteAllText(devKeyFile, generatedKey);
            return generatedKey;
        }
        catch
        {
            var fallbackBytes = new byte[32];
            RandomNumberGenerator.Fill(fallbackBytes);
            return Convert.ToBase64String(fallbackBytes);
        }
    }
}

