using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Npgsql;

namespace MacroGuard.Infrastructure.Security;

public static class DatabaseConnectionResolver
{
    public static string ResolveConnectionString(IConfiguration configuration, IHostEnvironment? environment = null)
    {
        // 1. Sprawdź, czy .env został załadowany
        EnvLoader.Load();

        // 2. Pobierz bazowy connection string z konfiguracji lub zmiennych środowiskowych
        var rawConnStr = configuration.GetConnectionString("DefaultConnection")
            ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
            ?? Environment.GetEnvironmentVariable("DATABASE_URL");

        var isProduction = environment?.IsProduction() 
            ?? string.Equals(Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"), "Production", StringComparison.OrdinalIgnoreCase);

        var baseConnStr = string.IsNullOrWhiteSpace(rawConnStr)
            ? "Host=localhost;Port=5432;Database=macroguard_db;Username=macroguard"
            : rawConnStr;

        var builder = new NpgsqlConnectionStringBuilder(baseConnStr);

        // 3. Jeśli hasło nie jest określone w connection stringu, sprawdź dedykowane zmienne środowiskowe
        if (string.IsNullOrWhiteSpace(builder.Password))
        {
            var envPassword = configuration["Database:Password"]
                ?? Environment.GetEnvironmentVariable("POSTGRES_PASSWORD")
                ?? Environment.GetEnvironmentVariable("DB_PASSWORD")
                ?? Environment.GetEnvironmentVariable("MACROGUARD_DB_PASSWORD");

            if (!string.IsNullOrWhiteSpace(envPassword))
            {
                builder.Password = envPassword;
            }
        }

        // 4. Weryfikacja dla środowiska produkcyjnego
        if (isProduction)
        {
            if (string.IsNullOrWhiteSpace(builder.Password))
            {
                throw new InvalidOperationException(
                    "KRYTYCZNY BŁĄD KONFIGURACJI [VULN-007]: Brak hasła do bazy danych PostgreSQL w środowisku produkcyjnym! " +
                    "Należy podać hasło w connection stringu lub zmiennej środowiskowej 'POSTGRES_PASSWORD'.");
            }

            if (builder.Password.Contains("macroguard_dev_password", StringComparison.OrdinalIgnoreCase))
            {
                throw new InvalidOperationException(
                    "KRYTYCZNY BŁĄD BEZPIECZEŃSTWA [VULN-007]: Wykryto użycie domyślnego hasła deweloperskiego ('macroguard_dev_password') w środowisku produkcyjnym! " +
                    "Skonfiguruj unikalne, silne hasło produkcyjne.");
            }
        }
        else
        {
            // 5. W środowisku deweloperskim: brak hasła wymusza jednoznaczną informację o konfiguracji
            if (string.IsNullOrWhiteSpace(builder.Password))
            {
                throw new InvalidOperationException(
                    "BŁĄD KONFIGURACJI BAZY DANYCH [VULN-007]: Brak hasła do bazy danych PostgreSQL. " +
                    "Ustaw 'POSTGRES_PASSWORD' w pliku '.env', User Secrets ('ConnectionStrings:DefaultConnection') lub zmiennej środowiskowej.");
            }
        }

        return builder.ConnectionString;
    }
}

