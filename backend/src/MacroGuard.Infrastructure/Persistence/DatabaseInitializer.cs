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

        // 1. Seed produktów spożywczych
        if (!await context.FoodItems.AnyAsync())
        {
            var defaultFoods = new List<FoodItem>
            {
                // Mięso i Ryby
                new() { Name = "Pierś z kurczaka (surowa)", Brand = "Świeże", Category = "Mięso i Ryby", CaloriesPer100g = 99, ProteinPer100g = 21.5m, CarbsPer100g = 0m, FatPer100g = 1.3m },
                new() { Name = "Pierś z indyka (surowa)", Brand = "Świeże", Category = "Mięso i Ryby", CaloriesPer100g = 84, ProteinPer100g = 19.2m, CarbsPer100g = 0m, FatPer100g = 0.7m },
                new() { Name = "Łosoś atlantycki (świeży)", Brand = "Rybny", Category = "Mięso i Ryby", CaloriesPer100g = 208, ProteinPer100g = 20.4m, CarbsPer100g = 0m, FatPer100g = 13.4m },
                new() { Name = "Wołowina mielona chuda (5% tł.)", Brand = "Masarnia", Category = "Mięso i Ryby", CaloriesPer100g = 137, ProteinPer100g = 21.4m, CarbsPer100g = 0m, FatPer100g = 5.0m },
                new() { Name = "Tuńczyk w sosie własnym", Brand = "Graal", Category = "Mięso i Ryby", CaloriesPer100g = 99, ProteinPer100g = 23.0m, CarbsPer100g = 0m, FatPer100g = 0.8m },

                // Nabiał i Jaja
                new() { Name = "Jajko kurze całe (1 szt. ~ 55g)", Brand = "Wiejskie", Category = "Nabiał i Jaja", CaloriesPer100g = 143, ProteinPer100g = 12.6m, CarbsPer100g = 0.7m, FatPer100g = 9.5m },
                new() { Name = "Skyr naturalny", Brand = "Piątnica", Category = "Nabiał i Jaja", CaloriesPer100g = 64, ProteinPer100g = 12.0m, CarbsPer100g = 4.1m, FatPer100g = 0.0m },
                new() { Name = "Twaróg chudy", Brand = "Piątnica", Category = "Nabiał i Jaja", CaloriesPer100g = 86, ProteinPer100g = 18.0m, CarbsPer100g = 3.5m, FatPer100g = 0.0m },
                new() { Name = "Serek wiejski lekki 3%", Brand = "Piątnica", Category = "Nabiał i Jaja", CaloriesPer100g = 81, ProteinPer100g = 11.0m, CarbsPer100g = 2.4m, FatPer100g = 3.0m },
                new() { Name = "Mozzarella light", Brand = "Galbani", Category = "Nabiał i Jaja", CaloriesPer100g = 165, ProteinPer100g = 19.0m, CarbsPer100g = 1.5m, FatPer100g = 9.0m },
                new() { Name = "Mleko spożywcze 1.5%", Brand = "Mlekovita", Category = "Nabiał i Jaja", CaloriesPer100g = 45, ProteinPer100g = 3.2m, CarbsPer100g = 4.7m, FatPer100g = 1.5m },

                // Zboża i Węglowodany
                new() { Name = "Płatki owsiane górskie", Brand = "Melvit", Category = "Zboża i Pieczywo", CaloriesPer100g = 366, ProteinPer100g = 11.9m, CarbsPer100g = 62.4m, FatPer100g = 7.2m },
                new() { Name = "Ryż biały basmati (przed ugotowaniem)", Brand = "Sonko", Category = "Zboża i Pieczywo", CaloriesPer100g = 348, ProteinPer100g = 7.8m, CarbsPer100g = 77.0m, FatPer100g = 0.6m },
                new() { Name = "Makaron pełnoziarnisty (suchy)", Brand = "Lubella", Category = "Zboża i Pieczywo", CaloriesPer100g = 345, ProteinPer100g = 13.5m, CarbsPer100g = 64.0m, FatPer100g = 2.2m },
                new() { Name = "Chleb żytni razowy na zakwasie", Brand = "Piekarnia", Category = "Zboża i Pieczywo", CaloriesPer100g = 218, ProteinPer100g = 5.8m, CarbsPer100g = 44.5m, FatPer100g = 1.3m },
                new() { Name = "Ziemniaki (surowe / gotowane)", Brand = "Warzywniak", Category = "Zboża i Pieczywo", CaloriesPer100g = 77, ProteinPer100g = 2.0m, CarbsPer100g = 17.5m, FatPer100g = 0.1m },

                // Warzywa i Owoce
                new() { Name = "Banan (obrany)", Brand = "Owoce", Category = "Warzywa i Owoce", CaloriesPer100g = 89, ProteinPer100g = 1.1m, CarbsPer100g = 22.8m, FatPer100g = 0.3m },
                new() { Name = "Jabłko", Brand = "Owoce", Category = "Warzywa i Owoce", CaloriesPer100g = 52, ProteinPer100g = 0.3m, CarbsPer100g = 13.8m, FatPer100g = 0.2m },
                new() { Name = "Borówki amerykańskie", Brand = "Owoce", Category = "Warzywa i Owoce", CaloriesPer100g = 57, ProteinPer100g = 0.7m, CarbsPer100g = 14.5m, FatPer100g = 0.3m },
                new() { Name = "Awokado Hass", Brand = "Warzywa", Category = "Warzywa i Owoce", CaloriesPer100g = 160, ProteinPer100g = 2.0m, CarbsPer100g = 8.5m, FatPer100g = 14.7m },
                new() { Name = "Brokuł", Brand = "Warzywa", Category = "Warzywa i Owoce", CaloriesPer100g = 34, ProteinPer100g = 2.8m, CarbsPer100g = 6.6m, FatPer100g = 0.4m },

                // Tłuszcze, Orzechy i Odżywki
                new() { Name = "Oliwa z oliwek Extra Virgin", Brand = "Monini", Category = "Tłuszcze i Orzechy", CaloriesPer100g = 884, ProteinPer100g = 0m, CarbsPer100g = 0m, FatPer100g = 100.0m },
                new() { Name = "Masło orzechowe 100% arachidowe", Brand = "Sante GoOn", Category = "Tłuszcze i Orzechy", CaloriesPer100g = 596, ProteinPer100g = 26.0m, CarbsPer100g = 14.0m, FatPer100g = 48.0m },
                new() { Name = "Orzechy włoskie", Brand = "Bakalland", Category = "Tłuszcze i Orzechy", CaloriesPer100g = 654, ProteinPer100g = 15.2m, CarbsPer100g = 13.7m, FatPer100g = 65.2m },
                new() { Name = "Odżywka białkowa WPC 80", Brand = "KFD / SFD", Category = "Odżywki i Przekąski", CaloriesPer100g = 385, ProteinPer100g = 78.0m, CarbsPer100g = 6.5m, FatPer100g = 5.5m }
            };

            await context.FoodItems.AddRangeAsync(defaultFoods);
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
    }

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
