using MacroGuard.Domain.Entities;
using MacroGuard.Domain.Enums;
using MacroGuard.Domain.Services;
using MacroGuard.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace MacroGuard.Infrastructure.Persistence;

public static class DatabaseInitializer
{
    public static async Task InitializeAsync(IServiceProvider services)
    {
        var context = services.GetRequiredService<MacroGuardDbContext>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = services.GetRequiredService<RoleManager<IdentityRole<Guid>>>();

        await context.Database.EnsureCreatedAsync();

        // Upewnij się, że tabela WeightEntries istnieje (jeśli baza już istniała wcześniej)
        await context.Database.ExecuteSqlRawAsync("""
            CREATE TABLE IF NOT EXISTS "WeightEntries" (
                "Id" uuid NOT NULL PRIMARY KEY,
                "UserId" uuid NOT NULL,
                "Date" date NOT NULL,
                "WeightKg" numeric(5,2) NOT NULL,
                "Note" character varying(200),
                "CreatedAtUtc" timestamp with time zone NOT NULL
            );
            CREATE UNIQUE INDEX IF NOT EXISTS "IX_WeightEntries_UserId_Date" ON "WeightEntries" ("UserId", "Date");

            CREATE TABLE IF NOT EXISTS "CustomMealSets" (
                "Id" uuid NOT NULL PRIMARY KEY,
                "UserId" uuid NOT NULL,
                "Name" character varying(120) NOT NULL,
                "Description" character varying(250),
                "DefaultMealType" integer,
                "CreatedAtUtc" timestamp with time zone NOT NULL
            );
            CREATE INDEX IF NOT EXISTS "IX_CustomMealSets_UserId" ON "CustomMealSets" ("UserId");

            CREATE TABLE IF NOT EXISTS "CustomMealSetItems" (
                "Id" uuid NOT NULL PRIMARY KEY,
                "CustomMealSetId" uuid NOT NULL REFERENCES "CustomMealSets" ("Id") ON DELETE CASCADE,
                "FoodItemId" uuid NOT NULL REFERENCES "FoodItems" ("Id") ON DELETE RESTRICT,
                "WeightGrams" numeric(7,2) NOT NULL
            );
            CREATE INDEX IF NOT EXISTS "IX_CustomMealSetItems_CustomMealSetId" ON "CustomMealSetItems" ("CustomMealSetId");

            ALTER TABLE "UserProfiles" ADD COLUMN IF NOT EXISTS "TargetWeightKg" numeric(5,2);
            ALTER TABLE "UserProfiles" ADD COLUMN IF NOT EXISTS "DeficitPercentage" integer;
            ALTER TABLE "UserProfiles" ADD COLUMN IF NOT EXISTS "WeeklyChangeKg" numeric(4,2);
        """);

        // 1. Bogata baza popularnych produktów spożywczych (w tym tłuszcze i oleje do smażenia)
        var defaultFoods = GetDefaultFoods();
        var existingNames = await context.FoodItems
            .Where(f => f.CreatedByUserId == null)
            .Select(f => f.Name)
            .ToListAsync();

        var existingNamesSet = new HashSet<string>(existingNames, StringComparer.OrdinalIgnoreCase);

        var newFoods = defaultFoods
            .Where(f => !existingNamesSet.Contains(f.Name))
            .ToList();

        if (newFoods.Count > 0)
        {
            await context.FoodItems.AddRangeAsync(newFoods);
            await context.SaveChangesAsync();
        }

        // 2. Seed ról (Admin, User)
        foreach (var roleName in new[] { "Admin", "User" })
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                await roleManager.CreateAsync(new IdentityRole<Guid>(roleName));
            }
        }

        // 3. Seed konta Admina (admin@macroguard.pl / Admin123!)
        await EnsureSeededUserAsync(
            userManager,
            context,
            email: "admin@macroguard.pl",
            password: "Admin123!",
            displayName: "Administrator",
            role: "Admin",
            age: 30,
            weightKg: 82m,
            heightCm: 182m,
            goal: DietGoal.Maintain,
            seedSampleMeals: false
        );

        // 4. Seed konta Testowego (test@macroguard.pl / Test123!) z przykładowym dziennikiem na dziś
        await EnsureSeededUserAsync(
            userManager,
            context,
            email: "test@macroguard.pl",
            password: "Test123!",
            displayName: "Dawid (Test)",
            role: "User",
            age: 26,
            weightKg: 78m,
            heightCm: 180m,
            goal: DietGoal.Cut,
            seedSampleMeals: true
        );

        // 5. Seed przykładowych pomiarów wagi dla konta testowego (ostatnie 21 dni)
        var testUser = await userManager.FindByEmailAsync("test@macroguard.pl");
        if (testUser is not null && !await context.WeightEntries.AnyAsync(w => w.UserId == testUser.Id))
        {
            var today = DateOnly.FromDateTime(DateTime.Today);
            var sampleWeights = new (int daysAgo, decimal weight, string? note)[]
            {
                (20, 79.8m, "Początek pomiarów"),
                (19, 79.9m, null),
                (18, 79.6m, null),
                (17, 79.5m, "Po treningu"),
                (16, 79.7m, "Po słonej kolacji"),
                (15, 79.3m, null),
                (14, 79.2m, null),
                (13, 79.0m, null),
                (12, 79.1m, null),
                (11, 78.8m, "Lekki spadek"),
                (10, 78.9m, null),
                (9, 78.6m, null),
                (8, 78.7m, null),
                (7, 78.5m, null),
                (6, 78.4m, null),
                (5, 78.3m, "Na czczo"),
                (4, 78.4m, null),
                (3, 78.2m, null),
                (2, 78.1m, null),
                (1, 78.0m, null),
                (0, 77.9m, "Dziś rano")
            };

            foreach (var item in sampleWeights)
            {
                context.WeightEntries.Add(new WeightEntry
                {
                    UserId = testUser.Id,
                    Date = today.AddDays(-item.daysAgo),
                    WeightKg = item.weight,
                    Note = item.note,
                    CreatedAtUtc = DateTime.UtcNow.AddDays(-item.daysAgo)
                });
            }

            await context.SaveChangesAsync();
        }
    }

    private static List<FoodItem> GetDefaultFoods() =>
    [
        // === TŁUSZCZE I OLEJE DO SMAŻENIA / DODATKI ===
        new() { Name = "Olej rzepakowy (do smażenia)", Brand = "Kujawski", Category = "Tłuszcze i Oleje", CaloriesPer100g = 884, ProteinPer100g = 0m, CarbsPer100g = 0m, FatPer100g = 100.0m },
        new() { Name = "Oliwa z oliwek Extra Virgin", Brand = "Monini", Category = "Tłuszcze i Oleje", CaloriesPer100g = 884, ProteinPer100g = 0m, CarbsPer100g = 0m, FatPer100g = 100.0m },
        new() { Name = "Masło ekstra 82%", Brand = "Łaciate", Category = "Tłuszcze i Oleje", CaloriesPer100g = 743, ProteinPer100g = 0.7m, CarbsPer100g = 0.7m, FatPer100g = 82.0m },
        new() { Name = "Masło klarowane (Ghee do smażenia)", Brand = "Mlekovita", Category = "Tłuszcze i Oleje", CaloriesPer100g = 898, ProteinPer100g = 0.1m, CarbsPer100g = 0m, FatPer100g = 99.8m },
        new() { Name = "Olej kokosowy rafinowany (do smażenia)", Brand = "KTC", Category = "Tłuszcze i Oleje", CaloriesPer100g = 862, ProteinPer100g = 0m, CarbsPer100g = 0m, FatPer100g = 100.0m },
        new() { Name = "Smalec wieprzowy", Brand = "Tradycyjny", Category = "Tłuszcze i Oleje", CaloriesPer100g = 900, ProteinPer100g = 0m, CarbsPer100g = 0m, FatPer100g = 100.0m },
        new() { Name = "Olej w sprayu (1 psiknięcie ~ 1g)", Brand = "Fry-Light / Best Joy", Category = "Tłuszcze i Oleje", CaloriesPer100g = 820, ProteinPer100g = 0m, CarbsPer100g = 0m, FatPer100g = 91.0m },
        new() { Name = "Majonez tradycyjny", Brand = "Kielecki / Winiary", Category = "Tłuszcze i Oleje", CaloriesPer100g = 680, ProteinPer100g = 1.2m, CarbsPer100g = 2.6m, FatPer100g = 73.0m },
        new() { Name = "Majonez lekki", Brand = "Hellmann's", Category = "Tłuszcze i Oleje", CaloriesPer100g = 275, ProteinPer100g = 0.8m, CarbsPer100g = 8.5m, FatPer100g = 26.0m },

        // === MIĘSO, RYBY I WĘDLINY ===
        new() { Name = "Pierś z kurczaka (surowa)", Brand = "Świeże", Category = "Mięso i Ryby", CaloriesPer100g = 99, ProteinPer100g = 21.5m, CarbsPer100g = 0m, FatPer100g = 1.3m },
        new() { Name = "Pierś z kurczaka pieczona / grillowana", Brand = "Domowe", Category = "Mięso i Ryby", CaloriesPer100g = 150, ProteinPer100g = 31.0m, CarbsPer100g = 0m, FatPer100g = 3.2m },
        new() { Name = "Pierś z indyka (surowa)", Brand = "Świeże", Category = "Mięso i Ryby", CaloriesPer100g = 84, ProteinPer100g = 19.2m, CarbsPer100g = 0m, FatPer100g = 0.7m },
        new() { Name = "Polędwiczka wieprzowa", Brand = "Świeże", Category = "Mięso i Ryby", CaloriesPer100g = 109, ProteinPer100g = 21.0m, CarbsPer100g = 0m, FatPer100g = 2.2m },
        new() { Name = "Schab wieprzowy bez kości", Brand = "Świeże", Category = "Mięso i Ryby", CaloriesPer100g = 129, ProteinPer100g = 23.0m, CarbsPer100g = 0m, FatPer100g = 4.1m },
        new() { Name = "Wołowina mielona chuda (5% tł.)", Brand = "Masarnia", Category = "Mięso i Ryby", CaloriesPer100g = 137, ProteinPer100g = 21.4m, CarbsPer100g = 0m, FatPer100g = 5.0m },
        new() { Name = "Mięso mielone z piersi indyka", Brand = "Świeże", Category = "Mięso i Ryby", CaloriesPer100g = 110, ProteinPer100g = 21.0m, CarbsPer100g = 0m, FatPer100g = 2.5m },
        new() { Name = "Stek wołowy (rostbef / antrykot)", Brand = "Świeże", Category = "Mięso i Ryby", CaloriesPer100g = 175, ProteinPer100g = 22.0m, CarbsPer100g = 0m, FatPer100g = 9.5m },
        new() { Name = "Łosoś atlantycki (świeży)", Brand = "Rybny", Category = "Mięso i Ryby", CaloriesPer100g = 208, ProteinPer100g = 20.4m, CarbsPer100g = 0m, FatPer100g = 13.4m },
        new() { Name = "Dorsz atlantycki (filet)", Brand = "Rybny", Category = "Mięso i Ryby", CaloriesPer100g = 78, ProteinPer100g = 17.7m, CarbsPer100g = 0m, FatPer100g = 0.7m },
        new() { Name = "Pstrąg tęczowy świeży", Brand = "Rybny", Category = "Mięso i Ryby", CaloriesPer100g = 141, ProteinPer100g = 19.2m, CarbsPer100g = 0m, FatPer100g = 6.6m },
        new() { Name = "Tuńczyk w sosie własnym", Brand = "Graal", Category = "Mięso i Ryby", CaloriesPer100g = 99, ProteinPer100g = 23.0m, CarbsPer100g = 0m, FatPer100g = 0.8m },
        new() { Name = "Tuńczyk w oleju", Brand = "Graal", Category = "Mięso i Ryby", CaloriesPer100g = 190, ProteinPer100g = 25.0m, CarbsPer100g = 0m, FatPer100g = 10.0m },
        new() { Name = "Makrela wędzona", Brand = "Rybny", Category = "Mięso i Ryby", CaloriesPer100g = 221, ProteinPer100g = 20.7m, CarbsPer100g = 0m, FatPer100g = 15.5m },
        new() { Name = "Krewetki gotowane", Brand = "Ocean", Category = "Mięso i Ryby", CaloriesPer100g = 85, ProteinPer100g = 18.0m, CarbsPer100g = 0.9m, FatPer100g = 0.9m },
        new() { Name = "Szynka z piersi kurczaka", Brand = "Morliny", Category = "Mięso i Ryby", CaloriesPer100g = 88, ProteinPer100g = 18.0m, CarbsPer100g = 1.2m, FatPer100g = 1.2m },
        new() { Name = "Kabanosy drobiowe Exclusive", Brand = "Tarczyński", Category = "Mięso i Ryby", CaloriesPer100g = 448, ProteinPer100g = 30.0m, CarbsPer100g = 3.5m, FatPer100g = 35.0m },
        new() { Name = "Boczek wędzony parzony", Brand = "Masarnia", Category = "Mięso i Ryby", CaloriesPer100g = 477, ProteinPer100g = 13.0m, CarbsPer100g = 0.5m, FatPer100g = 47.0m },

        // === NABIAŁ I JAJA ===
        new() { Name = "Jajko kurze całe (1 szt. ~ 55g)", Brand = "Wiejskie", Category = "Nabiał i Jaja", CaloriesPer100g = 143, ProteinPer100g = 12.6m, CarbsPer100g = 0.7m, FatPer100g = 9.5m },
        new() { Name = "Białko jaja kurzego", Brand = "Farma", Category = "Nabiał i Jaja", CaloriesPer100g = 52, ProteinPer100g = 10.9m, CarbsPer100g = 0.7m, FatPer100g = 0.2m },
        new() { Name = "Skyr naturalny", Brand = "Piątnica", Category = "Nabiał i Jaja", CaloriesPer100g = 64, ProteinPer100g = 12.0m, CarbsPer100g = 4.1m, FatPer100g = 0.0m },
        new() { Name = "Skyr waniliowy", Brand = "Piątnica", Category = "Nabiał i Jaja", CaloriesPer100g = 79, ProteinPer100g = 10.0m, CarbsPer100g = 9.5m, FatPer100g = 0.0m },
        new() { Name = "Twaróg chudy", Brand = "Piątnica", Category = "Nabiał i Jaja", CaloriesPer100g = 86, ProteinPer100g = 18.0m, CarbsPer100g = 3.5m, FatPer100g = 0.0m },
        new() { Name = "Twaróg półtłusty", Brand = "Piątnica", Category = "Nabiał i Jaja", CaloriesPer100g = 110, ProteinPer100g = 16.5m, CarbsPer100g = 3.7m, FatPer100g = 4.0m },
        new() { Name = "Serek wiejski lekki 3%", Brand = "Piątnica", Category = "Nabiał i Jaja", CaloriesPer100g = 81, ProteinPer100g = 11.0m, CarbsPer100g = 2.4m, FatPer100g = 3.0m },
        new() { Name = "Serek wiejski wysokobiałkowy", Brand = "Piątnica", Category = "Nabiał i Jaja", CaloriesPer100g = 95, ProteinPer100g = 14.0m, CarbsPer100g = 2.0m, FatPer100g = 3.0m },
        new() { Name = "Mozzarella light", Brand = "Galbani", Category = "Nabiał i Jaja", CaloriesPer100g = 165, ProteinPer100g = 19.0m, CarbsPer100g = 1.5m, FatPer100g = 9.0m },
        new() { Name = "Mozzarella w kulce", Brand = "Galbani", Category = "Nabiał i Jaja", CaloriesPer100g = 250, ProteinPer100g = 18.0m, CarbsPer100g = 1.5m, FatPer100g = 19.0m },
        new() { Name = "Ser Gouda w plastrach", Brand = "Mlekpol", Category = "Nabiał i Jaja", CaloriesPer100g = 356, ProteinPer100g = 25.0m, CarbsPer100g = 0.1m, FatPer100g = 28.0m },
        new() { Name = "Parmezan / Grana Padano tarty", Brand = "Zanetti", Category = "Nabiał i Jaja", CaloriesPer100g = 392, ProteinPer100g = 33.0m, CarbsPer100g = 0.0m, FatPer100g = 29.0m },
        new() { Name = "Mleko spożywcze 1.5%", Brand = "Mlekovita", Category = "Nabiał i Jaja", CaloriesPer100g = 45, ProteinPer100g = 3.2m, CarbsPer100g = 4.7m, FatPer100g = 1.5m },
        new() { Name = "Mleko spożywcze 3.2%", Brand = "Mlekovita", Category = "Nabiał i Jaja", CaloriesPer100g = 60, ProteinPer100g = 3.2m, CarbsPer100g = 4.7m, FatPer100g = 3.2m },
        new() { Name = "Napój migdałowy bez cukru", Brand = "Alpro", Category = "Nabiał i Jaja", CaloriesPer100g = 13, ProteinPer100g = 0.4m, CarbsPer100g = 0.2m, FatPer100g = 1.1m },
        new() { Name = "Jogurt grecki 0%", Brand = "Total", Category = "Nabiał i Jaja", CaloriesPer100g = 57, ProteinPer100g = 10.0m, CarbsPer100g = 4.0m, FatPer100g = 0.0m },
        new() { Name = "Jogurt naturalny gęsty", Brand = "Bakoma", Category = "Nabiał i Jaja", CaloriesPer100g = 61, ProteinPer100g = 4.3m, CarbsPer100g = 5.6m, FatPer100g = 2.5m },

        // === ZBOŻA, KASZE, MAKARONY I PIECZYWO ===
        new() { Name = "Płatki owsiane górskie", Brand = "Melvit", Category = "Zboża i Pieczywo", CaloriesPer100g = 366, ProteinPer100g = 11.9m, CarbsPer100g = 62.4m, FatPer100g = 7.2m },
        new() { Name = "Płatki jaglane", Brand = "Melvit", Category = "Zboża i Pieczywo", CaloriesPer100g = 364, ProteinPer100g = 11.0m, CarbsPer100g = 69.0m, FatPer100g = 3.5m },
        new() { Name = "Ryż biały basmati", Brand = "Sonko", Category = "Zboża i Pieczywo", CaloriesPer100g = 348, ProteinPer100g = 7.8m, CarbsPer100g = 77.0m, FatPer100g = 0.6m },
        new() { Name = "Ryż jaśminowy", Brand = "Sonko", Category = "Zboża i Pieczywo", CaloriesPer100g = 350, ProteinPer100g = 7.0m, CarbsPer100g = 78.0m, FatPer100g = 0.6m },
        new() { Name = "Ryż brązowy pełnoziarnisty", Brand = "Kupiec", Category = "Zboża i Pieczywo", CaloriesPer100g = 345, ProteinPer100g = 7.5m, CarbsPer100g = 71.0m, FatPer100g = 2.8m },
        new() { Name = "Kasza gryczana palona", Brand = "Janex", Category = "Zboża i Pieczywo", CaloriesPer100g = 346, ProteinPer100g = 12.6m, CarbsPer100g = 63.4m, FatPer100g = 3.1m },
        new() { Name = "Kasza bulgur", Brand = "Melvit", Category = "Zboża i Pieczywo", CaloriesPer100g = 342, ProteinPer100g = 12.3m, CarbsPer100g = 65.0m, FatPer100g = 1.3m },
        new() { Name = "Kasza kuskus", Brand = "Kupiec", Category = "Zboża i Pieczywo", CaloriesPer100g = 356, ProteinPer100g = 12.8m, CarbsPer100g = 72.0m, FatPer100g = 0.6m },
        new() { Name = "Makaron pełnoziarnisty (suchy)", Brand = "Lubella", Category = "Zboża i Pieczywo", CaloriesPer100g = 345, ProteinPer100g = 13.5m, CarbsPer100g = 64.0m, FatPer100g = 2.2m },
        new() { Name = "Makaron z pszenicy durum (spaghetti)", Brand = "Barilla", Category = "Zboża i Pieczywo", CaloriesPer100g = 355, ProteinPer100g = 12.5m, CarbsPer100g = 71.0m, FatPer100g = 1.5m },
        new() { Name = "Chleb żytni razowy na zakwasie", Brand = "Piekarnia", Category = "Zboża i Pieczywo", CaloriesPer100g = 218, ProteinPer100g = 5.8m, CarbsPer100g = 44.5m, FatPer100g = 1.3m },
        new() { Name = "Chleb pszenno-żytni", Brand = "Piekarnia", Category = "Zboża i Pieczywo", CaloriesPer100g = 245, ProteinPer100g = 6.5m, CarbsPer100g = 50.0m, FatPer100g = 1.4m },
        new() { Name = "Bułka grahamka (1 szt. ~ 70g)", Brand = "Piekarnia", Category = "Zboża i Pieczywo", CaloriesPer100g = 255, ProteinPer100g = 8.5m, CarbsPer100g = 49.0m, FatPer100g = 1.7m },
        new() { Name = "Tortilla pełnoziarnista (wraps)", Brand = "Mission", Category = "Zboża i Pieczywo", CaloriesPer100g = 295, ProteinPer100g = 8.5m, CarbsPer100g = 48.0m, FatPer100g = 6.5m },
        new() { Name = "Wafle ryżowe naturalne", Brand = "Sonko", Category = "Zboża i Pieczywo", CaloriesPer100g = 375, ProteinPer100g = 8.0m, CarbsPer100g = 80.0m, FatPer100g = 2.0m },
        new() { Name = "Ziemniaki (surowe / gotowane)", Brand = "Warzywniak", Category = "Zboża i Pieczywo", CaloriesPer100g = 77, ProteinPer100g = 2.0m, CarbsPer100g = 17.5m, FatPer100g = 0.1m },
        new() { Name = "Bataty (słodkie ziemniaki)", Brand = "Warzywniak", Category = "Zboża i Pieczywo", CaloriesPer100g = 86, ProteinPer100g = 1.6m, CarbsPer100g = 20.1m, FatPer100g = 0.1m },

        // === WARZYWA I OWOCE ===
        new() { Name = "Banan (obrany)", Brand = "Owoce", Category = "Warzywa i Owoce", CaloriesPer100g = 89, ProteinPer100g = 1.1m, CarbsPer100g = 22.8m, FatPer100g = 0.3m },
        new() { Name = "Jabłko", Brand = "Owoce", Category = "Warzywa i Owoce", CaloriesPer100g = 52, ProteinPer100g = 0.3m, CarbsPer100g = 13.8m, FatPer100g = 0.2m },
        new() { Name = "Truskawki świeże", Brand = "Owoce", Category = "Warzywa i Owoce", CaloriesPer100g = 32, ProteinPer100g = 0.7m, CarbsPer100g = 7.7m, FatPer100g = 0.3m },
        new() { Name = "Maliny", Brand = "Owoce", Category = "Warzywa i Owoce", CaloriesPer100g = 52, ProteinPer100g = 1.2m, CarbsPer100g = 11.9m, FatPer100g = 0.7m },
        new() { Name = "Borówki amerykańskie", Brand = "Owoce", Category = "Warzywa i Owoce", CaloriesPer100g = 57, ProteinPer100g = 0.7m, CarbsPer100g = 14.5m, FatPer100g = 0.3m },
        new() { Name = "Pomarańcza", Brand = "Owoce", Category = "Warzywa i Owoce", CaloriesPer100g = 47, ProteinPer100g = 0.9m, CarbsPer100g = 11.8m, FatPer100g = 0.1m },
        new() { Name = "Arbuz", Brand = "Owoce", Category = "Warzywa i Owoce", CaloriesPer100g = 30, ProteinPer100g = 0.6m, CarbsPer100g = 7.5m, FatPer100g = 0.2m },
        new() { Name = "Winogrona jasne", Brand = "Owoce", Category = "Warzywa i Owoce", CaloriesPer100g = 69, ProteinPer100g = 0.7m, CarbsPer100g = 18.1m, FatPer100g = 0.2m },
        new() { Name = "Awokado Hass", Brand = "Warzywa", Category = "Warzywa i Owoce", CaloriesPer100g = 160, ProteinPer100g = 2.0m, CarbsPer100g = 8.5m, FatPer100g = 14.7m },
        new() { Name = "Pomidor malinowy", Brand = "Warzywa", Category = "Warzywa i Owoce", CaloriesPer100g = 18, ProteinPer100g = 0.9m, CarbsPer100g = 3.9m, FatPer100g = 0.2m },
        new() { Name = "Ogórek szklarniowy", Brand = "Warzywa", Category = "Warzywa i Owoce", CaloriesPer100g = 15, ProteinPer100g = 0.7m, CarbsPer100g = 3.6m, FatPer100g = 0.1m },
        new() { Name = "Ogórki kiszone", Brand = "Wiejskie", Category = "Warzywa i Owoce", CaloriesPer100g = 12, ProteinPer100g = 0.6m, CarbsPer100g = 2.3m, FatPer100g = 0.1m },
        new() { Name = "Papryka czerwona", Brand = "Warzywa", Category = "Warzywa i Owoce", CaloriesPer100g = 31, ProteinPer100g = 1.0m, CarbsPer100g = 6.0m, FatPer100g = 0.3m },
        new() { Name = "Brokuł", Brand = "Warzywa", Category = "Warzywa i Owoce", CaloriesPer100g = 34, ProteinPer100g = 2.8m, CarbsPer100g = 6.6m, FatPer100g = 0.4m },
        new() { Name = "Kalafior", Brand = "Warzywa", Category = "Warzywa i Owoce", CaloriesPer100g = 25, ProteinPer100g = 1.9m, CarbsPer100g = 5.0m, FatPer100g = 0.3m },
        new() { Name = "Szpinak świeży / mrożony", Brand = "Warzywa", Category = "Warzywa i Owoce", CaloriesPer100g = 23, ProteinPer100g = 2.9m, CarbsPer100g = 3.6m, FatPer100g = 0.4m },
        new() { Name = "Cukinia", Brand = "Warzywa", Category = "Warzywa i Owoce", CaloriesPer100g = 17, ProteinPer100g = 1.2m, CarbsPer100g = 3.1m, FatPer100g = 0.3m },
        new() { Name = "Marchew", Brand = "Warzywa", Category = "Warzywa i Owoce", CaloriesPer100g = 41, ProteinPer100g = 0.9m, CarbsPer100g = 9.6m, FatPer100g = 0.2m },
        new() { Name = "Pieczarki świeże", Brand = "Warzywa", Category = "Warzywa i Owoce", CaloriesPer100g = 22, ProteinPer100g = 3.1m, CarbsPer100g = 3.3m, FatPer100g = 0.3m },
        new() { Name = "Cebula", Brand = "Warzywa", Category = "Warzywa i Owoce", CaloriesPer100g = 40, ProteinPer100g = 1.1m, CarbsPer100g = 9.3m, FatPer100g = 0.1m },
        new() { Name = "Czosnek (1 ząbek ~ 5g)", Brand = "Warzywa", Category = "Warzywa i Owoce", CaloriesPer100g = 149, ProteinPer100g = 6.4m, CarbsPer100g = 33.0m, FatPer100g = 0.5m },

        // === ORZECHY I NASIONA ===
        new() { Name = "Masło orzechowe 100% arachidowe", Brand = "Sante GoOn", Category = "Tłuszcze i Orzechy", CaloriesPer100g = 596, ProteinPer100g = 26.0m, CarbsPer100g = 14.0m, FatPer100g = 48.0m },
        new() { Name = "Orzechy włoskie", Brand = "Bakalland", Category = "Tłuszcze i Orzechy", CaloriesPer100g = 654, ProteinPer100g = 15.2m, CarbsPer100g = 13.7m, FatPer100g = 65.2m },
        new() { Name = "Migdały", Brand = "Bakalland", Category = "Tłuszcze i Orzechy", CaloriesPer100g = 579, ProteinPer100g = 21.2m, CarbsPer100g = 21.6m, FatPer100g = 49.9m },
        new() { Name = "Orzechy nerkowca", Brand = "Bakalland", Category = "Tłuszcze i Orzechy", CaloriesPer100g = 553, ProteinPer100g = 18.2m, CarbsPer100g = 30.2m, FatPer100g = 43.8m },
        new() { Name = "Nasiona chia", Brand = "Bio", Category = "Tłuszcze i Orzechy", CaloriesPer100g = 486, ProteinPer100g = 16.5m, CarbsPer100g = 42.1m, FatPer100g = 30.7m },
        new() { Name = "Siemię lniane", Brand = "Bio", Category = "Tłuszcze i Orzechy", CaloriesPer100g = 534, ProteinPer100g = 18.3m, CarbsPer100g = 28.9m, FatPer100g = 42.2m },
        new() { Name = "Pestki dyni", Brand = "Bakalland", Category = "Tłuszcze i Orzechy", CaloriesPer100g = 559, ProteinPer100g = 30.2m, CarbsPer100g = 10.7m, FatPer100g = 49.0m },

        // === ODŻYWKI, SOSY I DODATKI ===
        new() { Name = "Odżywka białkowa WPC 80", Brand = "KFD / SFD", Category = "Odżywki i Przekąski", CaloriesPer100g = 385, ProteinPer100g = 78.0m, CarbsPer100g = 6.5m, FatPer100g = 5.5m },
        new() { Name = "Izolat białka serwatkowego WPI 90", Brand = "KFD / SFD", Category = "Odżywki i Przekąski", CaloriesPer100g = 360, ProteinPer100g = 86.0m, CarbsPer100g = 1.5m, FatPer100g = 1.0m },
        new() { Name = "Baton proteinowy", Brand = "Go On / Barebells", Category = "Odżywki i Przekąski", CaloriesPer100g = 360, ProteinPer100g = 33.0m, CarbsPer100g = 30.0m, FatPer100g = 14.0m },
        new() { Name = "Miód pszczeli", Brand = "Pasieka", Category = "Odżywki i Przekąski", CaloriesPer100g = 304, ProteinPer100g = 0.3m, CarbsPer100g = 82.4m, FatPer100g = 0.0m },
        new() { Name = "Dżem 100% z owoców (bez cukru)", Brand = "Łowicz", Category = "Odżywki i Przekąski", CaloriesPer100g = 140, ProteinPer100g = 0.6m, CarbsPer100g = 34.0m, FatPer100g = 0.2m },
        new() { Name = "Czekolada gorzka 85%", Brand = "Wawel / Lindt", Category = "Odżywki i Przekąski", CaloriesPer100g = 580, ProteinPer100g = 11.0m, CarbsPer100g = 20.0m, FatPer100g = 48.0m },
        new() { Name = "Ketchup bez dodatku cukru", Brand = "Roleski / Kotlin", Category = "Odżywki i Przekąski", CaloriesPer100g = 45, ProteinPer100g = 1.5m, CarbsPer100g = 8.5m, FatPer100g = 0.2m },
        new() { Name = "Musztarda delikatesowa", Brand = "Kamis", Category = "Odżywki i Przekąski", CaloriesPer100g = 115, ProteinPer100g = 5.5m, CarbsPer100g = 7.5m, FatPer100g = 6.5m },
        new() { Name = "Sos sojowy jasny", Brand = "Kikkoman", Category = "Odżywki i Przekąski", CaloriesPer100g = 53, ProteinPer100g = 8.0m, CarbsPer100g = 5.0m, FatPer100g = 0.1m }
    ];

    private static async Task EnsureSeededUserAsync(
        UserManager<ApplicationUser> userManager,
        MacroGuardDbContext context,
        string email,
        string password,
        string displayName,
        string role,
        int age,
        decimal weightKg,
        decimal heightCm,
        DietGoal goal,
        bool seedSampleMeals)
    {
        var user = await userManager.FindByEmailAsync(email);
        if (user is not null)
        {
            return;
        }

        user = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = email,
            Email = email,
            EmailConfirmed = true,
            DisplayName = displayName
        };

        var createResult = await userManager.CreateAsync(user, password);
        if (!createResult.Succeeded)
        {
            return;
        }

        await userManager.AddToRoleAsync(user, role);

        var calc = MacroCalculator.Calculate(age, Gender.Male, weightKg, heightCm, ActivityLevel.ModeratelyActive, goal);
        context.UserProfiles.Add(new UserProfile
        {
            UserId = user.Id,
            Age = age,
            Gender = Gender.Male,
            WeightKg = weightKg,
            HeightCm = heightCm,
            ActivityLevel = ActivityLevel.ModeratelyActive,
            Goal = goal,
            BmrCalories = calc.BmrCalories,
            TdeeCalories = calc.TdeeCalories,
            TargetCalories = calc.TargetCalories,
            TargetProteinGrams = calc.TargetProteinGrams,
            TargetCarbsGrams = calc.TargetCarbsGrams,
            TargetFatGrams = calc.TargetFatGrams
        });

        if (seedSampleMeals)
        {
            var foods = await context.FoodItems.ToListAsync();
            var oats = foods.FirstOrDefault(f => f.Name.Contains("Płatki owsiane"));
            var skyr = foods.FirstOrDefault(f => f.Name.Contains("Skyr"));
            var chicken = foods.FirstOrDefault(f => f.Name.Contains("Pierś z kurczaka"));
            var rice = foods.FirstOrDefault(f => f.Name.Contains("Ryż"));
            var banana = foods.FirstOrDefault(f => f.Name.Contains("Banan"));
            var eggs = foods.FirstOrDefault(f => f.Name.Contains("Jajko"));

            var today = DateOnly.FromDateTime(DateTime.Today);
            var sampleEntries = new List<MealEntry>();

            if (oats is not null)
                sampleEntries.Add(new MealEntry { UserId = user.Id, FoodItemId = oats.Id, ConsumedDate = today, MealType = MealType.Breakfast, WeightGrams = 80 });
            if (skyr is not null)
                sampleEntries.Add(new MealEntry { UserId = user.Id, FoodItemId = skyr.Id, ConsumedDate = today, MealType = MealType.Breakfast, WeightGrams = 150 });
            if (chicken is not null)
                sampleEntries.Add(new MealEntry { UserId = user.Id, FoodItemId = chicken.Id, ConsumedDate = today, MealType = MealType.Lunch, WeightGrams = 200 });
            if (rice is not null)
                sampleEntries.Add(new MealEntry { UserId = user.Id, FoodItemId = rice.Id, ConsumedDate = today, MealType = MealType.Lunch, WeightGrams = 100 });
            if (banana is not null)
                sampleEntries.Add(new MealEntry { UserId = user.Id, FoodItemId = banana.Id, ConsumedDate = today, MealType = MealType.Snack, WeightGrams = 120 });
            if (eggs is not null)
                sampleEntries.Add(new MealEntry { UserId = user.Id, FoodItemId = eggs.Id, ConsumedDate = today, MealType = MealType.Dinner, WeightGrams = 165 });

            context.MealEntries.AddRange(sampleEntries);
        }

        await context.SaveChangesAsync();
    }
}
