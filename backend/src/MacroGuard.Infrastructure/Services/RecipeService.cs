using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using MacroGuard.Application.DTOs;
using MacroGuard.Application.Interfaces;
using MacroGuard.Domain.Entities;
using MacroGuard.Domain.Enums;
using MacroGuard.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace MacroGuard.Infrastructure.Services;

public class RecipeService(
    MacroGuardDbContext dbContext,
    IConfiguration configuration,
    ILogger<RecipeService> logger,
    IHttpClientFactory httpClientFactory) : IRecipeService
{
    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        PropertyNameCaseInsensitive = true,
        NumberHandling = JsonNumberHandling.AllowReadingFromString
    };

    private record ResolvedAiConfig(
        string Provider,
        string Model,
        string ApiKey,
        string BaseUrl,
        bool IsLiveAi,
        string DisplayName
    );

    public AiInfoDto GetAiInfo()
    {
        var cfg = ResolveAiConfig();
        return new AiInfoDto(
            Provider: cfg.Provider,
            ModelName: cfg.Model,
            IsLiveAi: cfg.IsLiveAi,
            DisplayName: cfg.DisplayName
        );
    }

    private ResolvedAiConfig ResolveAiConfig()
    {
        var provider = configuration["Ai:Provider"]?.Trim() ?? "Auto";
        var apiKey = configuration["Ai:ApiKey"]?.Trim() ?? "";
        var model = configuration["Ai:Model"]?.Trim() ?? "";
        var baseUrl = configuration["Ai:BaseUrl"]?.Trim() ?? "";

        // Kompatybilność wsteczna z Gemini:ApiKey
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            var legacyGemini = configuration["Gemini:ApiKey"]?.Trim();
            if (!string.IsNullOrWhiteSpace(legacyGemini))
            {
                apiKey = legacyGemini;
                provider = "Gemini";
            }
        }

        // Auto-detekcja dostawcy na podstawie prefiksu klucza lub BaseUrl
        if (string.Equals(provider, "Auto", StringComparison.OrdinalIgnoreCase))
        {
            if (!string.IsNullOrWhiteSpace(baseUrl) && baseUrl.Contains("11434"))
            {
                provider = "Ollama";
            }
            else if (apiKey.StartsWith("sk-ant-", StringComparison.OrdinalIgnoreCase))
            {
                provider = "Claude";
            }
            else if (apiKey.StartsWith("sk-", StringComparison.OrdinalIgnoreCase))
            {
                provider = "OpenAI";
            }
            else if (apiKey.StartsWith("AIza", StringComparison.OrdinalIgnoreCase) || (!string.IsNullOrWhiteSpace(apiKey) && string.IsNullOrWhiteSpace(baseUrl)))
            {
                provider = "Gemini";
            }
            else if (!string.IsNullOrWhiteSpace(apiKey))
            {
                provider = "OpenAI";
            }
        }

        // Dopasowanie modelu i formatu
        if (string.Equals(provider, "Gemini", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(apiKey))
        {
            var m = string.IsNullOrWhiteSpace(model) || model == "gemini-1.5-flash" || model == "gemini-2.5-flash" ? "gemini-3.5-flash-lite" : model;
            return new ResolvedAiConfig("Gemini", m, apiKey, baseUrl, true, $"Google Gemini ({m})");
        }

        if (string.Equals(provider, "OpenAI", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(apiKey))
        {
            var m = string.IsNullOrWhiteSpace(model) ? "gpt-4o-mini" : model;
            var url = string.IsNullOrWhiteSpace(baseUrl) ? "https://api.openai.com/v1" : baseUrl;
            return new ResolvedAiConfig("OpenAI", m, apiKey, url, true, $"OpenAI ({m})");
        }

        if (string.Equals(provider, "Claude", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(apiKey))
        {
            var m = string.IsNullOrWhiteSpace(model) ? "claude-3-5-haiku-20241022" : model;
            return new ResolvedAiConfig("Claude", m, apiKey, baseUrl, true, $"Anthropic Claude ({m})");
        }

        if (string.Equals(provider, "Ollama", StringComparison.OrdinalIgnoreCase) || (!string.IsNullOrWhiteSpace(baseUrl) && baseUrl.Contains("11434")))
        {
            var m = string.IsNullOrWhiteSpace(model) ? "llama3.2" : model;
            var url = string.IsNullOrWhiteSpace(baseUrl) ? "http://localhost:11434/v1" : baseUrl;
            return new ResolvedAiConfig("Ollama", m, apiKey, url, true, $"Ollama ({m})");
        }

        if ((string.Equals(provider, "OpenAiCompatible", StringComparison.OrdinalIgnoreCase) ||
             string.Equals(provider, "Groq", StringComparison.OrdinalIgnoreCase) ||
             string.Equals(provider, "DeepSeek", StringComparison.OrdinalIgnoreCase)) && (!string.IsNullOrWhiteSpace(apiKey) || !string.IsNullOrWhiteSpace(baseUrl)))
        {
            var m = string.IsNullOrWhiteSpace(model) ? "default-model" : model;
            var pName = string.Equals(provider, "OpenAiCompatible", StringComparison.OrdinalIgnoreCase) ? "OpenAI-Compatible" : provider;
            return new ResolvedAiConfig(pName, m, apiKey, baseUrl, true, $"{pName} ({m})");
        }

        return new ResolvedAiConfig(
            Provider: "BuiltIn",
            Model: "MacroGuard Culinary Engine",
            ApiKey: "",
            BaseUrl: "",
            IsLiveAi: false,
            DisplayName: "Wbudowany silnik kulinarny MacroGuard"
        );
    }

    public async Task<GeneratedRecipeDto> GenerateRecipeAsync(GenerateRecipeRequest request, CancellationToken ct = default)
    {
        var config = ResolveAiConfig();

        if (config.IsLiveAi)
        {
            try
            {
                GeneratedRecipeDto? recipe = config.Provider switch
                {
                    "Gemini" => await TryGenerateWithGeminiAsync(config, request, ct),
                    "Claude" => await TryGenerateWithClaudeAsync(config, request, ct),
                    _ => await TryGenerateWithOpenAiCompatibleAsync(config, request, ct)
                };

                if (recipe is not null)
                {
                    logger.LogInformation("Pomyślnie wygenerowano przepis z użyciem {DisplayName}.", config.DisplayName);
                    return await SynchronizeRecipeWithDatabaseAndScaleAsync(recipe, request.TargetCalories, ct);
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Błąd podczas wywołania {DisplayName}. Przełączanie na wbudowany silnik kulinarny.", config.DisplayName);
            }
        }

        // Wbudowany inteligentny generator kulinarny
        var builtIn = GenerateBuiltInRecipe(request);
        return await SynchronizeRecipeWithDatabaseAndScaleAsync(builtIn, request.TargetCalories, ct);
    }

    public async Task<List<MealEntryDto>> ApplyRecipeToDiaryAsync(Guid userId, ApplyRecipeRequest request, CancellationToken ct = default)
    {
        var createdDtos = new List<MealEntryDto>();

        foreach (var ingredient in request.Ingredients)
        {
            if (ingredient.WeightGrams <= 0) continue;

            // Sprawdź czy produkt już istnieje w bazie (globalny lub użytkownika)
            var normalizedName = ingredient.Name.Trim().ToLower();
            var food = await dbContext.FoodItems
                .FirstOrDefaultAsync(f => (f.CreatedByUserId == null || f.CreatedByUserId == userId)
                                       && f.Name.ToLower() == normalizedName, ct);

            if (food is null)
            {
                food = new FoodItem
                {
                    Name = ingredient.Name.Trim(),
                    Brand = "Przepis AI",
                    Category = string.IsNullOrWhiteSpace(ingredient.Category) ? "Ogólne" : ingredient.Category.Trim(),
                    CaloriesPer100g = Math.Max(0, ingredient.CaloriesPer100g),
                    ProteinPer100g = Math.Max(0, ingredient.ProteinPer100g),
                    CarbsPer100g = Math.Max(0, ingredient.CarbsPer100g),
                    FatPer100g = Math.Max(0, ingredient.FatPer100g),
                    CreatedByUserId = userId
                };
                dbContext.FoodItems.Add(food);
                await dbContext.SaveChangesAsync(ct);
            }

            var entry = new MealEntry
            {
                UserId = userId,
                FoodItemId = food.Id,
                FoodItem = food,
                ConsumedDate = request.ConsumedDate,
                MealType = request.MealType,
                WeightGrams = Math.Round(ingredient.WeightGrams, 1)
            };

            dbContext.MealEntries.Add(entry);
            await dbContext.SaveChangesAsync(ct);

            createdDtos.Add(new MealEntryDto(
                Id: entry.Id,
                FoodItemId: food.Id,
                FoodName: food.Name,
                Brand: food.Brand,
                MealType: entry.MealType,
                WeightGrams: entry.WeightGrams,
                Calories: entry.CalculatedCalories,
                Protein: entry.CalculatedProtein,
                Carbs: entry.CalculatedCarbs,
                Fat: entry.CalculatedFat
            ));
        }

        return createdDtos;
    }

    private async Task<GeneratedRecipeDto> SynchronizeRecipeWithDatabaseAndScaleAsync(
        GeneratedRecipeDto recipe,
        int targetCalories,
        CancellationToken ct)
    {
        if (recipe.Ingredients.Count == 0) return recipe;

        // 1. Dopasuj do bazy danych - jeśli produkt już istnieje, bierzemy jego oficjalne makro na 100g
        var normalizedList = new List<(RecipeIngredientDto Original, decimal Kcal100, decimal Prot100, decimal Carb100, decimal Fat100, string Cat)>();

        foreach (var ing in recipe.Ingredients)
        {
            var normName = ing.Name.Trim().ToLower();
            var existing = await dbContext.FoodItems
                .AsNoTracking()
                .FirstOrDefaultAsync(f => f.Name.ToLower() == normName, ct);

            if (existing is not null)
            {
                normalizedList.Add((ing, existing.CaloriesPer100g, existing.ProteinPer100g, existing.CarbsPer100g, existing.FatPer100g, existing.Category));
            }
            else
            {
                normalizedList.Add((ing, ing.CaloriesPer100g, ing.ProteinPer100g, ing.CarbsPer100g, ing.FatPer100g, ing.Category));
            }
        }

        // 2. Oblicz sumę kalorii ze składników w oparciu o ich rzeczywiste parametry
        decimal currentSumKcal = 0;
        foreach (var item in normalizedList)
        {
            currentSumKcal += item.Kcal100 * item.Original.WeightGrams / 100m;
        }

        // 3. Oblicz współczynnik skalowania, aby trafić w żądany cel użytkownika
        decimal scale = 1.0m;
        if (currentSumKcal > 50 && targetCalories > 50)
        {
            scale = (decimal)targetCalories / currentSumKcal;
            if (scale < 0.65m) scale = 0.65m;
            if (scale > 1.45m) scale = 1.45m;
        }

        var updatedIngredients = new List<RecipeIngredientDto>();
        decimal finalKcal = 0, finalProt = 0, finalCarbs = 0, finalFat = 0;

        foreach (var item in normalizedList)
        {
            decimal scaledWeight = Math.Max(5, Math.Round(item.Original.WeightGrams * scale, 0));

            // Dokładnie taka sama formuła jak w encji MealEntry (zaokrąglenie do 1 miejsca)
            decimal pKcal = Math.Round(item.Kcal100 * scaledWeight / 100m, 1);
            decimal pProt = Math.Round(item.Prot100 * scaledWeight / 100m, 1);
            decimal pCarb = Math.Round(item.Carb100 * scaledWeight / 100m, 1);
            decimal pFat = Math.Round(item.Fat100 * scaledWeight / 100m, 1);

            finalKcal += pKcal;
            finalProt += pProt;
            finalCarbs += pCarb;
            finalFat += pFat;

            updatedIngredients.Add(new RecipeIngredientDto(
                Name: item.Original.Name,
                WeightGrams: scaledWeight,
                CaloriesPer100g: item.Kcal100,
                ProteinPer100g: item.Prot100,
                CarbsPer100g: item.Carb100,
                FatPer100g: item.Fat100,
                PortionCalories: pKcal,
                PortionProtein: pProt,
                PortionCarbs: pCarb,
                PortionFat: pFat,
                Category: item.Cat
            ));
        }

        return recipe with
        {
            TotalCalories = (int)Math.Round(finalKcal),
            TotalProtein = Math.Round(finalProt, 1),
            TotalCarbs = Math.Round(finalCarbs, 1),
            TotalFat = Math.Round(finalFat, 1),
            Ingredients = updatedIngredients
        };
    }

    private static string BuildPrompt(GenerateRecipeRequest req)
    {
        var mealName = req.MealType switch
        {
            MealType.Breakfast => "Śniadanie",
            MealType.SecondBreakfast => "II Śniadanie",
            MealType.Lunch => "Obiad",
            MealType.AfternoonSnack => "Podwieczorek",
            MealType.Dinner => "Kolacja",
            MealType.Snack => "Przekąska",
            MealType.PreWorkout => "Posiłek przedtreningowy",
            MealType.PostWorkout => "Posiłek potreningowy",
            MealType.ExtraMeal => "Dodatkowy posiłek",
            MealType.Drinks => "Napoje i Koktajle",
            _ => "Posiłek"
        };

        return $@"Jesteś ekspertem dietetyki i szefem kuchni.
Stwórz jeden pyszny, zbilansowany przepis na posiłek typu: {mealName}.
Docelowa kaloryczność całego dania: około {req.TargetCalories} kcal (tolerancja +/- 5%).
Dodatkowe preferencje użytkownika: {req.Preference ?? "brak specjalnych preferencji"}.

Odpowiedz WYŁĄCZNIE poprawnym obiektem JSON w poniższym formacie, bez żadnego dodatkowego tekstu ani znaczników markdown:
{{
  ""title"": ""Nazwa dania"",
  ""description"": ""Krótki, apetyczny opis"",
  ""prepTimeMinutes"": 15,
  ""totalCalories"": {req.TargetCalories},
  ""totalProtein"": 35.0,
  ""totalCarbs"": 50.0,
  ""totalFat"": 15.0,
  ""ingredients"": [
    {{
      ""name"": ""Pierś z kurczaka"",
      ""weightGrams"": 150.0,
      ""caloriesPer100g"": 99.0,
      ""proteinPer100g"": 21.5,
      ""carbsPer100g"": 0.0,
      ""fatPer100g"": 1.3,
      ""portionCalories"": 148.5,
      ""portionProtein"": 32.2,
      ""portionCarbs"": 0.0,
      ""portionFat"": 2.0,
      ""category"": ""Mięso i Ryby""
    }}
  ],
  ""steps"": [
    ""Krok 1: ..."",
    ""Krok 2: ...""
  ]
}}";
    }

    private static GeneratedRecipeDto? ParseRecipeJson(string rawText, string modelDisplayName)
    {
        if (string.IsNullOrWhiteSpace(rawText)) return null;

        var cleaned = rawText.Trim();
        if (cleaned.StartsWith("```json", StringComparison.OrdinalIgnoreCase))
        {
            cleaned = cleaned[7..];
        }
        else if (cleaned.StartsWith("```"))
        {
            cleaned = cleaned[3..];
        }

        if (cleaned.EndsWith("```"))
        {
            cleaned = cleaned[..^3];
        }
        cleaned = cleaned.Trim();

        var dto = JsonSerializer.Deserialize<GeneratedRecipeDto>(cleaned, JsonOpts);
        if (dto is null) return null;

        return dto with { AiModelUsed = modelDisplayName };
    }

    private async Task<GeneratedRecipeDto?> TryGenerateWithGeminiAsync(ResolvedAiConfig cfg, GenerateRecipeRequest req, CancellationToken ct)
    {
        var client = httpClientFactory.CreateClient();
        var prompt = BuildPrompt(req);

        var body = new
        {
            contents = new[]
            {
                new { parts = new[] { new { text = prompt } } }
            },
            generationConfig = new
            {
                response_mime_type = "application/json"
            }
        };

        var candidateModels = new List<string> { cfg.Model };
        if (!candidateModels.Contains("gemini-3.5-flash-lite")) candidateModels.Add("gemini-3.5-flash-lite");
        if (!candidateModels.Contains("gemini-flash-latest")) candidateModels.Add("gemini-flash-latest");
        if (!candidateModels.Contains("gemini-3.7-flash")) candidateModels.Add("gemini-3.7-flash");

        foreach (var modelName in candidateModels)
        {
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{modelName}:generateContent?key={cfg.ApiKey}";
            var response = await client.PostAsJsonAsync(url, body, ct);
            if (!response.IsSuccessStatusCode)
            {
                var err = await response.Content.ReadAsStringAsync(ct);
                logger.LogWarning("Gemini API ({Model}) zwróciło błąd {StatusCode}: {Error}. Próba z kolejnym modelem...", modelName, response.StatusCode, err);
                continue;
            }

            var json = await response.Content.ReadAsStringAsync(ct);
            using var doc = JsonDocument.Parse(json);
            if (!doc.RootElement.TryGetProperty("candidates", out var candidates) || candidates.GetArrayLength() == 0)
            {
                continue;
            }

            var parts = candidates[0].GetProperty("content").GetProperty("parts");
            string? text = null;
            foreach (var part in parts.EnumerateArray())
            {
                if (part.TryGetProperty("text", out var tProp))
                {
                    text = tProp.GetString();
                    if (!string.IsNullOrWhiteSpace(text)) break;
                }
            }

            if (!string.IsNullOrWhiteSpace(text))
            {
                var recipe = ParseRecipeJson(text, $"Google Gemini ({modelName})");
                if (recipe is not null) return recipe;
            }
        }

        return null;
    }

    private async Task<GeneratedRecipeDto?> TryGenerateWithOpenAiCompatibleAsync(ResolvedAiConfig cfg, GenerateRecipeRequest req, CancellationToken ct)
    {
        var client = httpClientFactory.CreateClient();
        var prompt = BuildPrompt(req);

        var baseUrl = string.IsNullOrWhiteSpace(cfg.BaseUrl) ? "https://api.openai.com/v1" : cfg.BaseUrl.TrimEnd('/');
        var url = $"{baseUrl}/chat/completions";

        var requestMessage = new HttpRequestMessage(HttpMethod.Post, url);
        if (!string.IsNullOrWhiteSpace(cfg.ApiKey))
        {
            requestMessage.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", cfg.ApiKey);
        }

        var body = new
        {
            model = cfg.Model,
            response_format = new { type = "json_object" },
            messages = new[]
            {
                new { role = "system", content = "Jesteś ekspertem dietetyki i szefem kuchni. Odpowiadaj wyłącznie poprawnym kodem JSON." },
                new { role = "user", content = prompt }
            },
            temperature = 0.7
        };
        requestMessage.Content = JsonContent.Create(body);

        var response = await client.SendAsync(requestMessage, ct);
        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync(ct);
            logger.LogWarning("{Provider} API error ({StatusCode}): {Error}", cfg.Provider, response.StatusCode, err);
            return null;
        }

        var json = await response.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(json);
        var text = doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString();

        return ParseRecipeJson(text ?? "", cfg.DisplayName);
    }

    private async Task<GeneratedRecipeDto?> TryGenerateWithClaudeAsync(ResolvedAiConfig cfg, GenerateRecipeRequest req, CancellationToken ct)
    {
        var client = httpClientFactory.CreateClient();
        var prompt = BuildPrompt(req);

        var requestMessage = new HttpRequestMessage(HttpMethod.Post, "https://api.anthropic.com/v1/messages");
        requestMessage.Headers.Add("x-api-key", cfg.ApiKey);
        requestMessage.Headers.Add("anthropic-version", "2023-06-01");

        var body = new
        {
            model = cfg.Model,
            max_tokens = 2048,
            system = "Jesteś ekspertem dietetyki i szefem kuchni. Zawsze odpowiadaj wyłącznie poprawnym kodem JSON zgodnym z żądaną strukturą.",
            messages = new[]
            {
                new { role = "user", content = prompt }
            }
        };
        requestMessage.Content = JsonContent.Create(body);

        var response = await client.SendAsync(requestMessage, ct);
        if (!response.IsSuccessStatusCode)
        {
            var err = await response.Content.ReadAsStringAsync(ct);
            logger.LogWarning("Claude API error ({StatusCode}): {Error}", response.StatusCode, err);
            return null;
        }

        var json = await response.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(json);
        var text = doc.RootElement
            .GetProperty("content")[0]
            .GetProperty("text")
            .GetString();

        return ParseRecipeJson(text ?? "", cfg.DisplayName);
    }

    private static GeneratedRecipeDto GenerateBuiltInRecipe(GenerateRecipeRequest req)
    {
        var targetKcal = Math.Max(200, req.TargetCalories);
        var templates = GetBuiltInTemplates(req.MealType, req.Preference);
        var chosen = templates[Random.Shared.Next(templates.Count)];

        // Skalowanie porcji składników tak, aby suma kalorii równała się targetKcal
        decimal baseKcal = chosen.Ingredients.Sum(i => i.BaseGrams * i.Kcal100 / 100m);
        if (baseKcal <= 0) baseKcal = 500m;

        decimal scale = targetKcal / baseKcal;

        var scaledIngredients = new List<RecipeIngredientDto>();
        decimal sumKcal = 0, sumProt = 0, sumCarbs = 0, sumFat = 0;

        foreach (var ing in chosen.Ingredients)
        {
            decimal weight = Math.Round(ing.BaseGrams * scale, 0);
            if (weight < 5) weight = 5;

            decimal pKcal = Math.Round(ing.Kcal100 * weight / 100m, 1);
            decimal pProt = Math.Round(ing.Prot100 * weight / 100m, 1);
            decimal pCarb = Math.Round(ing.Carb100 * weight / 100m, 1);
            decimal pFat = Math.Round(ing.Fat100 * weight / 100m, 1);

            sumKcal += pKcal;
            sumProt += pProt;
            sumCarbs += pCarb;
            sumFat += pFat;

            scaledIngredients.Add(new RecipeIngredientDto(
                Name: ing.Name,
                WeightGrams: weight,
                CaloriesPer100g: ing.Kcal100,
                ProteinPer100g: ing.Prot100,
                CarbsPer100g: ing.Carb100,
                FatPer100g: ing.Fat100,
                PortionCalories: pKcal,
                PortionProtein: pProt,
                PortionCarbs: pCarb,
                PortionFat: pFat,
                Category: ing.Category
            ));
        }

        return new GeneratedRecipeDto(
            Title: chosen.Title,
            Description: chosen.Description,
            PrepTimeMinutes: chosen.PrepTimeMinutes,
            TotalCalories: (int)Math.Round(sumKcal),
            TotalProtein: Math.Round(sumProt, 1),
            TotalCarbs: Math.Round(sumCarbs, 1),
            TotalFat: Math.Round(sumFat, 1),
            Ingredients: scaledIngredients,
            Steps: chosen.Steps
        );
    }

    private record RawIngredient(string Name, decimal BaseGrams, decimal Kcal100, decimal Prot100, decimal Carb100, decimal Fat100, string Category);
    private record RecipeTemplate(string Title, string Description, int PrepTimeMinutes, List<RawIngredient> Ingredients, List<string> Steps, MealType Type, bool IsSweet = false, bool IsVeg = false);

    private static List<RecipeTemplate> GetBuiltInTemplates(MealType mealType, string? preference)
    {
        var targetType = mealType switch
        {
            MealType.SecondBreakfast => MealType.Breakfast,
            MealType.AfternoonSnack => MealType.Snack,
            MealType.PreWorkout => MealType.Snack,
            MealType.PostWorkout => MealType.Lunch,
            MealType.ExtraMeal => MealType.Snack,
            MealType.Drinks => MealType.Snack,
            _ => mealType
        };

        var all = GetAllTemplates();
        var filtered = all.Where(t => t.Type == targetType).ToList();

        if (!string.IsNullOrWhiteSpace(preference))
        {
            var p = preference.ToLower();
            if (p.Contains("słod") || p.Contains("sweet"))
            {
                var sweet = filtered.Where(t => t.IsSweet).ToList();
                if (sweet.Count > 0) return sweet;
            }
            if (p.Contains("wege") || p.Contains("veg"))
            {
                var veg = filtered.Where(t => t.IsVeg).ToList();
                if (veg.Count > 0) return veg;
            }
        }

        return filtered.Count > 0 ? filtered : all;
    }

    private static List<RecipeTemplate> GetAllTemplates() =>
    [
        // === ŚNIADANIA ===
        new(
            Title: "Shakshuka z pomidorami malinowymi, fetą i ziołami",
            Description: "Pyszne, aromatyczne danie jednogarnkowe z jajkami sadzonymi w pomidorach z dodatkiem oliwy i pieczywa.",
            PrepTimeMinutes: 15,
            Ingredients: [
                new("Jajko kurze całe", 110, 143, 12.6m, 0.7m, 9.5m, "Nabiał i Jaja"),
                new("Pomidor malinowy", 200, 18, 0.9m, 3.9m, 0.2m, "Warzywa i Owoce"),
                new("Oliwa z oliwek Extra Virgin", 10, 884, 0m, 0m, 100m, "Tłuszcze i Oleje"),
                new("Chleb żytni razowy na zakwasie", 70, 218, 5.8m, 44.5m, 1.3m, "Zboża i Pieczywo"),
                new("Czosnek", 5, 149, 6.4m, 33m, 0.5m, "Warzywa i Owoce")
            ],
            Steps: [
                "Na rozgrzanej oliwie podsmaż drobno posiekany czosnek.",
                "Dodaj pokrojone w kostkę pomidory, dopraw solą, pieprzem i oregano. Duś przez 5 minut, aż sos zgęstnieje.",
                "Zrób wgłębienia w sosie i wbij jajka. Przykryj patelnię i smaż na małym ogniu przez ok. 4-5 minut do ścięcia białek.",
                "Podawaj ze świeżym pieczywem żytnim."
            ],
            Type: MealType.Breakfast,
            IsVeg: true
        ),
        new(
            Title: "Kremowa owsianka z bananem, masłem orzechowym i skyrem",
            Description: "Klasyczne, pełnowartościowe śniadanie dające energię na wiele godzin dzięki węglowodanom złożonym i zdrowym tłuszczom.",
            PrepTimeMinutes: 10,
            Ingredients: [
                new("Płatki owsiane górskie", 60, 366, 11.9m, 62.4m, 7.2m, "Zboża i Pieczywo"),
                new("Skyr naturalny", 150, 64, 12m, 4.1m, 0m, "Nabiał i Jaja"),
                new("Banan (obrany)", 100, 89, 1.1m, 22.8m, 0.3m, "Warzywa i Owoce"),
                new("Masło orzechowe 100% arachidowe", 20, 596, 26m, 14m, 48m, "Tłuszcze i Orzechy"),
                new("Borówki amerykańskie", 50, 57, 0.7m, 14.5m, 0.3m, "Warzywa i Owoce")
            ],
            Steps: [
                "Płatki owsiane zalej gorącą wodą lub mlekiem i gotuj na małym ogniu przez 3-4 minuty.",
                "Zdejmij z ognia, wymieszaj ze skyrem naturalnym, by uzyskać kremową konsystencję.",
                "Przełóż do miski, ułóż pokrojonego banana, świeże borówki i polej masłem orzechowym."
            ],
            Type: MealType.Breakfast,
            IsSweet: true,
            IsVeg: true
        ),
        new(
            Title: "Tosty z awokado, jajkiem sadzonym i mozzarellą light",
            Description: "Chrupiące tosty pełnoziarniste ze świeżym puree z awokado, soczystym jajkiem i delikatnym serem.",
            PrepTimeMinutes: 12,
            Ingredients: [
                new("Chleb żytni razowy na zakwasie", 80, 218, 5.8m, 44.5m, 1.3m, "Zboża i Pieczywo"),
                new("Jajko kurze całe", 110, 143, 12.6m, 0.7m, 9.5m, "Nabiał i Jaja"),
                new("Awokado Hass", 50, 160, 2m, 8.5m, 14.7m, "Warzywa i Owoce"),
                new("Mozzarella light", 40, 165, 19m, 1.5m, 9m, "Nabiał i Jaja"),
                new("Pomidor malinowy", 80, 18, 0.9m, 3.9m, 0.2m, "Warzywa i Owoce")
            ],
            Steps: [
                "Pieczywo opiecz w tosterze lub na suchej patelni.",
                "Awokado rozgnieć widelcem z odrobiną soli, pieprzu i soku z cytryny, a następnie rozsmaruj na grzankach.",
                "Usmaż jajka sadzone na patelni.",
                "Na tostach ułóż plastry mozzarelli, pomidora i przykryj gorącym jajkiem sadzonym."
            ],
            Type: MealType.Breakfast,
            IsVeg: true
        ),

        // === OBIADY ===
        new(
            Title: "Bowl z soczystym kurczakiem, ryżem basmati i awokado",
            Description: "Zbilansowany, kolorowy posiłek kulturystyczny o doskonałym profilu aminokwasowym i dużej zawartości mikroskładników.",
            PrepTimeMinutes: 20,
            Ingredients: [
                new("Pierś z kurczaka (surowa)", 180, 99, 21.5m, 0m, 1.3m, "Mięso i Ryby"),
                new("Ryż biały basmati", 75, 348, 7.8m, 77m, 0.6m, "Zboża i Pieczywo"),
                new("Oliwa z oliwek Extra Virgin", 10, 884, 0m, 0m, 100m, "Tłuszcze i Oleje"),
                new("Awokado Hass", 40, 160, 2m, 8.5m, 14.7m, "Warzywa i Owoce"),
                new("Brokuł", 120, 34, 2.8m, 6.6m, 0.4m, "Warzywa i Owoce"),
                new("Papryka czerwona", 80, 31, 1m, 6m, 0.3m, "Warzywa i Owoce")
            ],
            Steps: [
                "Ugotuj ryż basmati w osolonej wodzie wg instrukcji na opakowaniu.",
                "Pierś z kurczaka pokrój w kostkę, przypraw papryką słodką, czosnkiem i solą. Usmaż na oliwie na złoty kolor.",
                "Brokuł ugotuj na parze przez ok. 5 minut, by pozostał chrupiący.",
                "Ułóż w misce ryż, kurczaka, brokuł, paski papryki oraz pokrojone awokado."
            ],
            Type: MealType.Lunch
        ),
        new(
            Title: "Łosoś pieczony w cytrynie z puree ziemniaczanym i szpinakiem",
            Description: "Wykwintny obiad bogaty w kwasy tłuszczowe Omega-3, białko oraz potas ze świeżych ziemniaków.",
            PrepTimeMinutes: 25,
            Ingredients: [
                new("Łosoś atlantycki (świeży)", 150, 208, 20.4m, 0m, 13.4m, "Mięso i Ryby"),
                new("Ziemniaki (surowe / gotowane)", 250, 77, 2m, 17.5m, 0.1m, "Zboża i Pieczywo"),
                new("Masło ekstra 82%", 10, 743, 0.7m, 0.7m, 82m, "Tłuszcze i Oleje"),
                new("Szpinak świeży / mrożony", 100, 23, 2.9m, 3.6m, 0.4m, "Warzywa i Owoce"),
                new("Czosnek", 5, 149, 6.4m, 33m, 0.5m, "Warzywa i Owoce")
            ],
            Steps: [
                "Ziemniaki obierz i ugotuj w osolonej wodzie, po czym ugnieć z dodatkiem masła.",
                "Filet z łososia skrop cytryną, posyp solą i koperkiem. Piecz w 180°C przez 15-18 minut.",
                "Na patelni podduś szpinak z przeciśniętym czosnkiem i odrobiną soli.",
                "Podawaj rybę z kremowym puree i ciepłym szpinakiem."
            ],
            Type: MealType.Lunch
        ),
        new(
            Title: "Makaron penne z polędwiczką wieprzową w sosie pomidorowym",
            Description: "Włoski klasyk w wersji fitness: chuda polędwiczka wieprzowa, makaron durum i aromatyczny sos pomidorowy z bazylią.",
            PrepTimeMinutes: 20,
            Ingredients: [
                new("Polędwiczka wieprzowa", 160, 109, 21m, 0m, 2.2m, "Mięso i Ryby"),
                new("Makaron pełnoziarnisty (suchy)", 70, 345, 13.5m, 64m, 2.2m, "Zboża i Pieczywo"),
                new("Oliwa z oliwek Extra Virgin", 10, 884, 0m, 0m, 100m, "Tłuszcze i Oleje"),
                new("Pomidor malinowy", 150, 18, 0.9m, 3.9m, 0.2m, "Warzywa i Owoce"),
                new("Parmezan / Grana Padano tarty", 15, 392, 33m, 0m, 29m, "Nabiał i Jaja")
            ],
            Steps: [
                "Ugotuj makaron al dente w osolonej wodzie.",
                "Polędwiczkę pokrój w plasterki i szybko podsmaż na oliwie z oliwek (ok. 2-3 min z każdej strony).",
                "Dodaj zblendowane pomidory, oregano, bazylię i duś przez 5 minut.",
                "Wymieszaj makaron z sosem i mięsem, a przed podaniem posyp tartym parmezanem."
            ],
            Type: MealType.Lunch
        ),

        // === PRZEKĄSKI ===
        new(
            Title: "Wysokobiałkowy szejk czekoladowo-orzechowy z bananem",
            Description: "Ekspresowa, sycąca przekąska proteinowa po treningu lub do pracy.",
            PrepTimeMinutes: 5,
            Ingredients: [
                new("Mleko spożywcze 1.5%", 250, 45, 3.2m, 4.7m, 1.5m, "Nabiał i Jaja"),
                new("Odżywka białkowa WPC 80", 30, 385, 78m, 6.5m, 5.5m, "Odżywki i Przekąski"),
                new("Banan (obrany)", 120, 89, 1.1m, 22.8m, 0.3m, "Warzywa i Owoce"),
                new("Masło orzechowe 100% arachidowe", 15, 596, 26m, 14m, 48m, "Tłuszcze i Orzechy")
            ],
            Steps: [
                "Do blendera wlej mleko.",
                "Dodaj miarkę odżywki białkowej, pokrojonego banana oraz masło orzechowe.",
                "Blenduj na najwyższych obrotach przez 30 sekund na gładki koktajl."
            ],
            Type: MealType.Snack,
            IsSweet: true,
            IsVeg: true
        ),
        new(
            Title: "Kanapki z twarogiem, rzodkiewką i szczypiorkiem",
            Description: "Tradycyjna, lekka polska przekąska z chrupiącego pieczywa żytniego i kremowego twarogu.",
            PrepTimeMinutes: 5,
            Ingredients: [
                new("Chleb żytni razowy na zakwasie", 70, 218, 5.8m, 44.5m, 1.3m, "Zboża i Pieczywo"),
                new("Twaróg chudy", 120, 86, 18m, 3.5m, 0m, "Nabiał i Jaja"),
                new("Jogurt naturalny gęsty", 30, 61, 4.3m, 5.6m, 2.5m, "Nabiał i Jaja"),
                new("Ogórek szklarniowy", 80, 15, 0.7m, 3.6m, 0.1m, "Warzywa i Owoce")
            ],
            Steps: [
                "Twaróg rozgnieć widelcem z jogurtem naturalnym, solą i pieprzem.",
                "Posmaruj kromki chleba przygotowaną pastą twarogową.",
                "Na wierzchu ułóż plastry świeżego ogórka."
            ],
            Type: MealType.Snack,
            IsVeg: true
        ),

        // === KOLACJE ===
        new(
            Title: "Tortilla wrap z tuńczykiem, jajkiem i świeżymi warzywami",
            Description: "Szybka i lekka kolacja na zimno lub na ciepło z chrupiącą tortillą pełnoziarnistą.",
            PrepTimeMinutes: 10,
            Ingredients: [
                new("Tortilla pełnoziarnista (wraps)", 65, 295, 8.5m, 48m, 6.5m, "Zboża i Pieczywo"),
                new("Tuńczyk w sosie własnym", 100, 99, 23m, 0m, 0.8m, "Mięso i Ryby"),
                new("Jajko kurze całe", 55, 143, 12.6m, 0.7m, 9.5m, "Nabiał i Jaja"),
                new("Majonez lekki", 15, 275, 0.8m, 8.5m, 26m, "Tłuszcze i Oleje"),
                new("Pomidor malinowy", 60, 18, 0.9m, 3.9m, 0.2m, "Warzywa i Owoce"),
                new("Ogórek kiszony", 50, 12, 0.6m, 2.3m, 0.1m, "Warzywa i Owoce")
            ],
            Steps: [
                "Ugotuj jajko na twardo (ok. 8 minut), ostudź i pokrój w kostkę.",
                "Tuńczyka odsącz z zalewy, wymieszaj z pokrojonym jajkiem, majonezem lekkim, solą i pieprzem.",
                "Rozłóż farsz na tortilli, dodaj plasterki pomidora i ogórka kiszonego.",
                "Zawiń ciasno w rulon i podpiecz krótko na suchej patelni lub w opiekaczu."
            ],
            Type: MealType.Dinner
        ),
        new(
            Title: "Sałatka śródziemnomorska z grillowanym indykiem i mozzarellą",
            Description: "Niskowęglowodanowa, lekka kolacja pełna witamin, idealna na zakończenie dnia.",
            PrepTimeMinutes: 15,
            Ingredients: [
                new("Pierś z indyka (surowa)", 160, 84, 19.2m, 0m, 0.7m, "Mięso i Ryby"),
                new("Mozzarella light", 60, 165, 19m, 1.5m, 9m, "Nabiał i Jaja"),
                new("Oliwa z oliwek Extra Virgin", 10, 884, 0m, 0m, 100m, "Tłuszcze i Oleje"),
                new("Pomidor malinowy", 120, 18, 0.9m, 3.9m, 0.2m, "Warzywa i Owoce"),
                new("Ogórek szklarniowy", 100, 15, 0.7m, 3.6m, 0.1m, "Warzywa i Owoce"),
                new("Pestki dyni", 15, 559, 30.2m, 10.7m, 49m, "Tłuszcze i Orzechy")
            ],
            Steps: [
                "Pierś z indyka przypraw ziołami prowansalskimi i usmaż na patelni grillowej.",
                "Pokrój mięso w paski, a warzywa i mozzarellę w kostkę.",
                "Połącz składniki w misce, skrop oliwą z oliwek i posyp uprażonymi pestkami dyni."
            ],
            Type: MealType.Dinner
        )
    ];
}
