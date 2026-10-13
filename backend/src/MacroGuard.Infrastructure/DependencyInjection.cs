using System.Text;
using MacroGuard.Application.Interfaces;
using MacroGuard.Infrastructure.Identity;
using MacroGuard.Infrastructure.Persistence;
using MacroGuard.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace MacroGuard.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? "Host=localhost;Port=5432;Database=macroguard_db;Username=macroguard;Password=macroguard_dev_password";

        services.AddDbContext<MacroGuardDbContext>(options =>
            options.UseNpgsql(connectionString));

        services.AddIdentityCore<ApplicationUser>(options =>
            {
                options.Password.RequireDigit = false;
                options.Password.RequireLowercase = false;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequireUppercase = false;
                options.Password.RequiredLength = 6;
                options.User.RequireUniqueEmail = true;
            })
            .AddRoles<IdentityRole<Guid>>()
            .AddEntityFrameworkStores<MacroGuardDbContext>()
            .AddDefaultTokenProviders();

        var jwtKey = configuration["Jwt:Key"] ?? "MacroGuard_SuperSecretDevelopmentKey_2026_AtLeast32Bytes!";
        var jwtIssuer = configuration["Jwt:Issuer"] ?? "MacroGuard.Api";
        var jwtAudience = configuration["Jwt:Audience"] ?? "MacroGuard.Client";

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = jwtIssuer,
                    ValidAudience = jwtAudience,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
                };
            });

        services.AddAuthorization();

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IProfileService, ProfileService>();
        services.AddScoped<IFoodService, FoodService>();
        services.AddScoped<IDiaryService, DiaryService>();
        services.AddScoped<IEmailSender, SmtpEmailSender>();

        return services;
    }
}

