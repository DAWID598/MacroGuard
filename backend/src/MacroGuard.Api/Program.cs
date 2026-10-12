using MacroGuard.Infrastructure;
using MacroGuard.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddInfrastructure(builder.Configuration);

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
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Automatyczna inicjalizacja i seedowanie bazy danych (produkty + konta testowe/admina) przy starcie
using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        await DatabaseInitializer.InitializeAsync(scope.ServiceProvider);
        logger.LogInformation("Baza danych MacroGuard (produkty + konta testowe) została pomyślnie zainicjalizowana.");
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Nie udało się połączyć z bazą PostgreSQL przy starcie. Upewnij się, że kontener Docker działa (docker compose up -d).");
    }
}

app.Run();
