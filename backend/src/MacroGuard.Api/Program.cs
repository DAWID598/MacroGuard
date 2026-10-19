using System.Threading.RateLimiting;
using MacroGuard.Infrastructure;
using MacroGuard.Infrastructure.Persistence;
using MacroGuard.Infrastructure.Security;
using Microsoft.AspNetCore.RateLimiting;

EnvLoader.Load();

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddInfrastructure(builder.Configuration, builder.Environment);

// Ochrona przed Brute Force i DDoS — Rate Limiting dla punktów autoryzacji
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddFixedWindowLimiter("auth-endpoints", opt =>
    {
        opt.PermitLimit = builder.Environment.IsDevelopment() ? 100 : 10;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 0;
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AngularClient", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors("AngularClient");
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Automatyczna inicjalizacja bazy danych (struktura tabel + publiczna baza produktów) przy starcie
using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        await DatabaseInitializer.InitializeAsync(scope.ServiceProvider, app.Environment);
        logger.LogInformation("Baza danych MacroGuard (tabele i produkty) została pomyślnie zainicjalizowana.");
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Nie udało się połączyć z bazą PostgreSQL przy starcie. Upewnij się, że kontener Docker działa (docker compose up -d).");
    }
}

app.Run();
