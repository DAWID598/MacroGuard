using System.Text;
using MacroGuard.Application.Interfaces;
using MacroGuard.Infrastructure.Identity;
using MacroGuard.Infrastructure.Persistence;
using MacroGuard.Infrastructure.Security;
using MacroGuard.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;

namespace MacroGuard.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration, IHostEnvironment? environment = null)
    {
        var connectionString = DatabaseConnectionResolver.ResolveConnectionString(configuration, environment);

        services.AddDbContext<MacroGuardDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddIdentityCore<ApplicationUser>(options =>
            {
                options.Password.RequireDigit = true;
                options.Password.RequireLowercase = true;
                options.Password.RequireUppercase = true;
                options.Password.RequireNonAlphanumeric = true;
                options.Password.RequiredLength = 10;
                options.Password.RequiredUniqueChars = 3;
                options.User.RequireUniqueEmail = true;

                // Ochrona przed Brute Force — blokada konta po 5 nieudanych próbach na 5 minut
                options.Lockout.AllowedForNewUsers = true;
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);
            })
            .AddRoles<IdentityRole<Guid>>()
            .AddEntityFrameworkStores<MacroGuardDbContext>()
            .AddErrorDescriber<IdentityPolishErrorDescriber>()
            .AddDefaultTokenProviders();

        var jwtKeyProvider = new JwtKeyProvider(configuration, environment);
        services.AddSingleton<IJwtKeyProvider>(jwtKeyProvider);

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtKeyProvider.GetIssuer(),
                    ValidAudience = jwtKeyProvider.GetAudience(),
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKeyProvider.GetSigningKey()))
                };
            });

        services.AddAuthorization();

        services.AddHttpClient();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IProfileService, ProfileService>();
        services.AddScoped<IFoodService, FoodService>();
        services.AddScoped<IDiaryService, DiaryService>();
        services.AddScoped<IEmailSender, SmtpEmailSender>();
        services.AddScoped<IRecipeService, RecipeService>();
        services.AddScoped<IWeightService, WeightService>();
        services.AddScoped<ICustomMealSetService, CustomMealSetService>();
        services.AddScoped<IReportService, ReportService>();
        services.AddScoped<IAiCoachService, AiCoachService>();

        return services;
    }
}

