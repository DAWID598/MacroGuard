using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using MacroGuard.Application.DTOs;
using MacroGuard.Application.Interfaces;
using MacroGuard.Domain.Enums;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace MacroGuard.Infrastructure.Services;

public class AiCoachService(
    IReportService reportService,
    IConfiguration configuration,
    ILogger<AiCoachService> logger,
    IHttpClientFactory httpClientFactory) : IAiCoachService
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

    public async Task<AiCoachReportDto> GenerateCoachReportAsync(Guid userId, AiCoachRequest request, CancellationToken ct = default)
    {
        var days = request.Days is 30 ? 30 : 7;
        var periodStats = await reportService.GeneratePeriodReportAsync(userId, days, ct);
        var config = ResolveAiConfig();

        if (config.IsLiveAi)
        {
            try
            {
                var prompt = BuildCoachPrompt(periodStats);
                var aiResponseJson = config.Provider switch
                {
                    "Gemini" => await CallGeminiAsync(config, prompt, ct),
                    "Claude" => await CallClaudeAsync(config, prompt, ct),
                    _ => await CallOpenAiCompatibleAsync(config, prompt, ct)
                };

                if (!string.IsNullOrWhiteSpace(aiResponseJson))
                {
                    var parsed = ParseAiReport(aiResponseJson);
                    if (parsed is not null)
                    {
                        return new AiCoachReportDto(
                            Headline: parsed.Headline,
                            Summary: parsed.Summary,
                            CalorieAnalysis: parsed.CalorieAnalysis,
                            MacroAnalysis: parsed.MacroAnalysis,
                            WeightTrendAnalysis: parsed.WeightTrendAnalysis,
                            Recommendations: parsed.Recommendations ?? [],
                            AvgCalories: periodStats.AvgCalories,
                            TargetCalories: periodStats.TargetCalories,
                            AvgProteinGrams: periodStats.AvgProtein,
                            TargetProteinGrams: periodStats.TargetProteinGrams,
                            WeightChangeKg: periodStats.WeightChangeKg,
                            LoggedDaysCount: periodStats.LoggedDays,
                            TotalDaysInPeriod: periodStats.TotalDays,
                            AiModelUsed: config.DisplayName,
                            GeneratedAtUtc: DateTime.UtcNow
                        );
                    }
                }
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Błąd podczas wywołania AI Coach ({DisplayName}). Uruchamianie wbudowanego algorytmu.", config.DisplayName);
            }
        }

        // Inteligentny wbudowany algorytm dietetyka MacroGuard
        return GenerateBuiltInCoachReport(periodStats);
    }

    private ResolvedAiConfig ResolveAiConfig()
    {
        var provider = configuration["Ai:Provider"]?.Trim() ?? "Auto";
        var apiKey = configuration["Ai:ApiKey"]?.Trim() ?? "";
        var model = configuration["Ai:Model"]?.Trim() ?? "";
        var baseUrl = configuration["Ai:BaseUrl"]?.Trim() ?? "";

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            var legacyGemini = configuration["Gemini:ApiKey"]?.Trim();
            if (!string.IsNullOrWhiteSpace(legacyGemini))
            {
                apiKey = legacyGemini;
                provider = "Gemini";
            }
        }

        if (string.Equals(provider, "Auto", StringComparison.OrdinalIgnoreCase))
        {
            if (!string.IsNullOrWhiteSpace(baseUrl) && baseUrl.Contains("11434"))
                provider = "Ollama";
            else if (apiKey.StartsWith("sk-ant-", StringComparison.OrdinalIgnoreCase))
                provider = "Claude";
            else if (apiKey.StartsWith("AIzaSy", StringComparison.OrdinalIgnoreCase))
                provider = "Gemini";
            else if (apiKey.StartsWith("sk-", StringComparison.OrdinalIgnoreCase))
                provider = "OpenAI";
            else if (!string.IsNullOrWhiteSpace(apiKey))
                provider = "OpenAiCompatible";
        }

        if (string.Equals(provider, "Gemini", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(apiKey))
        {
            var m = string.IsNullOrWhiteSpace(model) ? "gemini-3.5-flash-lite" : model;
            return new ResolvedAiConfig("Gemini", m, apiKey, "https://generativelanguage.googleapis.com", true, $"Google Gemini ({m})");
        }

        if (string.Equals(provider, "OpenAI", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(apiKey))
        {
            var m = string.IsNullOrWhiteSpace(model) ? "gpt-4o-mini" : model;
            return new ResolvedAiConfig("OpenAI", m, apiKey, "https://api.openai.com/v1", true, $"OpenAI ({m})");
        }

        if (string.Equals(provider, "Claude", StringComparison.OrdinalIgnoreCase) && !string.IsNullOrWhiteSpace(apiKey))
        {
            var m = string.IsNullOrWhiteSpace(model) ? "claude-3-5-sonnet-20241022" : model;
            return new ResolvedAiConfig("Claude", m, apiKey, "https://api.anthropic.com", true, $"Anthropic Claude ({m})");
        }

        if (string.Equals(provider, "Ollama", StringComparison.OrdinalIgnoreCase))
        {
            var m = string.IsNullOrWhiteSpace(model) ? "llama3" : model;
            var u = string.IsNullOrWhiteSpace(baseUrl) ? "http://localhost:11434/v1" : baseUrl;
            return new ResolvedAiConfig("Ollama", m, "ollama", u, true, $"Ollama ({m})");
        }

        return new ResolvedAiConfig("BuiltIn", "MacroGuard Analytics", "", "", false, "Wbudowany asystent dietetyczny MacroGuard");
    }

    private static string BuildCoachPrompt(PeriodReportDto stats)
    {
        var goalText = stats.Goal switch
        {
            DietGoal.Cut => "Redukcja tkanki tłuszczowej (deficyt kaloryczny)",
            DietGoal.Bulk => "Budowa masy mięśniowej (nadwyżka kaloryczna)",
            _ => "Utrzymanie wagi / Rekompozycja"
        };

        return $@"Jesteś 'MacroGuard AI Coach' — doświadczonym, empatycznym dietetykiem sportowym.
Przeanalizuj poniższe rzeczywiste dane użytkownika za ostatni okres ({stats.TotalDays} dni):
- Użytkownik: {stats.UserDisplayName}
- Cel sylwetkowy: {goalText}
- Cel dzienny kalorii: {stats.TargetCalories} kcal | Średnio spożyto: {stats.AvgCalories} kcal ({stats.CalorieAdherencePercent}% celu)
- Cel białka: {stats.TargetProteinGrams} g | Średnio spożyto: {stats.AvgProtein} g
- Średnie węglowodany: {stats.AvgCarbs} g | Średnie tłuszcze: {stats.AvgFat} g
- Liczba dni ze spisanym dziennikiem: {stats.LoggedDays} z {stats.TotalDays} dni
- Waga początkowa: {(stats.StartWeightKg.HasValue ? stats.StartWeightKg + " kg" : "brak danych")}
- Waga końcowa: {(stats.EndWeightKg.HasValue ? stats.EndWeightKg + " kg" : "brak danych")}
- Zmiana wagi w okresie: {(stats.WeightChangeKg.HasValue ? (stats.WeightChangeKg > 0 ? "+" : "") + stats.WeightChangeKg + " kg" : "brak danych")}

Twoim zadaniem jest stworzenie motywującego, rzeczowego podsumowania. Pamiętaj:
1. Skoki wagi z dnia na dzień to głównie woda i sól.
2. Zwróć uwagę na ilość białka (kluczowe do ochrony mięśni i sytości).
3. Pochwal za regularność, wskaż konkretne małe kroki na kolejny tydzień.

Zwróć odpowiedź WYŁĄCZNIE jako poprawny obiekt JSON (bez markdown, bez znaczników ```json):
{{
  ""headline"": ""Krótki, chwytliwy tytuł (np. 'Świetna robota w tym tygodniu! Realne tempo redukcji')"",
  ""summary"": ""1-2 zdania bezpośredniego podsumowania..."",
  ""calorieAnalysis"": ""Ocena bilansu kalorycznego..."",
  ""macroAnalysis"": ""Ocena proporcji białka, węglowodanów i tłuszczu..."",
  ""weightTrendAnalysis"": ""Analiza zmiany wagi..."",
  ""recommendations"": [
    ""Konkretna wskazówka 1..."",
    ""Konkretna wskazówka 2..."",
    ""Konkretna wskazówka 3...""
  ]
}}";
    }

    private class AiReportJsonModel
    {
        public string Headline { get; set; } = string.Empty;
        public string Summary { get; set; } = string.Empty;
        public string CalorieAnalysis { get; set; } = string.Empty;
        public string MacroAnalysis { get; set; } = string.Empty;
        public string WeightTrendAnalysis { get; set; } = string.Empty;
        public List<string> Recommendations { get; set; } = [];
    }

    private static AiReportJsonModel? ParseAiReport(string json)
    {
        var cleaned = json.Trim();
        if (cleaned.StartsWith("```json")) cleaned = cleaned[7..];
        else if (cleaned.StartsWith("```")) cleaned = cleaned[3..];
        if (cleaned.EndsWith("```")) cleaned = cleaned[..^3];
        cleaned = cleaned.Trim();

        return JsonSerializer.Deserialize<AiReportJsonModel>(cleaned, JsonOpts);
    }

    private async Task<string?> CallGeminiAsync(ResolvedAiConfig cfg, string prompt, CancellationToken ct)
    {
        var client = httpClientFactory.CreateClient();
        var body = new
        {
            contents = new[] { new { parts = new[] { new { text = prompt } } } },
            generationConfig = new { response_mime_type = "application/json" }
        };

        var candidateModels = new List<string> { cfg.Model };
        if (!candidateModels.Contains("gemini-3.5-flash-lite")) candidateModels.Add("gemini-3.5-flash-lite");
        if (!candidateModels.Contains("gemini-flash-latest")) candidateModels.Add("gemini-flash-latest");

        foreach (var m in candidateModels)
        {
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{m}:generateContent?key={cfg.ApiKey}";
            var resp = await client.PostAsJsonAsync(url, body, ct);
            if (!resp.IsSuccessStatusCode) continue;

            var json = await resp.Content.ReadAsStringAsync(ct);
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("candidates", out var candidates) && candidates.GetArrayLength() > 0)
            {
                var parts = candidates[0].GetProperty("content").GetProperty("parts");
                foreach (var p in parts.EnumerateArray())
                {
                    if (p.TryGetProperty("text", out var t)) return t.GetString();
                }
            }
        }
        return null;
    }

    private async Task<string?> CallOpenAiCompatibleAsync(ResolvedAiConfig cfg, string prompt, CancellationToken ct)
    {
        var client = httpClientFactory.CreateClient();
        if (!string.IsNullOrWhiteSpace(cfg.ApiKey) && cfg.ApiKey != "ollama")
        {
            client.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", cfg.ApiKey);
        }

        var endpoint = cfg.BaseUrl.TrimEnd('/') + "/chat/completions";
        var body = new
        {
            model = cfg.Model,
            messages = new[]
            {
                new { role = "system", content = "You are a professional nutrition coach returning JSON." },
                new { role = "user", content = prompt }
            },
            response_format = new { type = "json_object" }
        };

        var resp = await client.PostAsJsonAsync(endpoint, body, ct);
        if (!resp.IsSuccessStatusCode) return null;

        var json = await resp.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(json);
        return doc.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content").GetString();
    }

    private async Task<string?> CallClaudeAsync(ResolvedAiConfig cfg, string prompt, CancellationToken ct)
    {
        var client = httpClientFactory.CreateClient();
        client.DefaultRequestHeaders.Add("x-api-key", cfg.ApiKey);
        client.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01");

        var body = new
        {
            model = cfg.Model,
            max_tokens = 1500,
            messages = new[] { new { role = "user", content = prompt } }
        };

        var resp = await client.PostAsJsonAsync("https://api.anthropic.com/v1/messages", body, ct);
        if (!resp.IsSuccessStatusCode) return null;

        var json = await resp.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(json);
        var content = doc.RootElement.GetProperty("content");
        foreach (var block in content.EnumerateArray())
        {
            if (block.GetProperty("type").GetString() == "text") return block.GetProperty("text").GetString();
        }
        return null;
    }

    private static AiCoachReportDto GenerateBuiltInCoachReport(PeriodReportDto stats)
    {
        var adherence = stats.CalorieAdherencePercent;
        string headline;
        string summary;
        string calAnalysis;
        string macroAnalysis;
        string weightAnalysis;
        var recommendations = new List<string>();

        // Analiza kalorii
        if (stats.LoggedDays < 3)
        {
            headline = "Zacznij od regularności zapisywania posiłków!";
            summary = $"W analizowanym okresie ({stats.TotalDays} dni) uzupełniłeś dziennik w {stats.LoggedDays} dniach. Aby widzieć realny trend, postaraj się spisywać jedzenie codziennie.";
            calAnalysis = "Zbyt mało danych do pełnej oceny bilansu. Pamiętaj, że nawet 1 niespisany dzień może zaburzyć obraz tygodnia.";
        }
        else if (adherence >= 90 && adherence <= 110)
        {
            headline = "Doskonała dyscyplina! Cel kaloryczny trafiony w punkt.";
            summary = $"Średnio spożywałeś {stats.AvgCalories:F0} kcal przy celu {stats.TargetCalories} kcal ({adherence:F0}%). Twoja konsekwencja zasługuje na uznanie.";
            calAnalysis = "Twój bilans energetyczny jest dokładnie tam, gdzie powinien być. Trzymasz zaplanowany deficyt/nadwyżkę z wysoką precyzją.";
        }
        else if (adherence < 90)
        {
            headline = "Uwaga: Zjadłeś zauważalnie mniej niż zaplanowano!";
            summary = $"Twoje średnie spożycie to {stats.AvgCalories:F0} kcal, co stanowi tylko {adherence:F0}% Twojego celu ({stats.TargetCalories} kcal).";
            calAnalysis = "Zbyt głęboki deficyt na dłuższą metę spowalnia metabolizm, osłabia regenerację i grozi napadami głodu w weekend. Staraj się dojadać do wyznaczonego celu.";
        }
        else
        {
            headline = "Lekka nadwyżka ponad założony plan kaloryczny.";
            summary = $"Średnio spożywałeś {stats.AvgCalories:F0} kcal wobec celu {stats.TargetCalories} kcal ({adherence:F0}%).";
            calAnalysis = "Jeśli Twoim celem jest redukcja, sprawdź ukryte kalorie: oliwa do smażenia, napoje słodzone czy sosy potrafią niepostrzeżenie dodać 200-400 kcal dziennie.";
        }

        // Analiza makroskładników
        var protRatio = stats.TargetProteinGrams > 0 ? (stats.AvgProtein / stats.TargetProteinGrams) * 100 : 100;
        if (protRatio >= 85)
        {
            macroAnalysis = $"Podaż białka ({stats.AvgProtein:F0}g na cel {stats.TargetProteinGrams}g) jest na wzorowym poziomie! Świetnie chronisz masę mięśniową i zapewniasz sobie sytość na długie godziny.";
        }
        else
        {
            macroAnalysis = $"Średnie spożycie białka ({stats.AvgProtein:F0}g) jest poniżej założonego celu ({stats.TargetProteinGrams}g). Dorzuć do każdego posiłku źródło protein: chudy twaróg, skyr, jajka lub pierś z drobiu.";
            recommendations.Add("Zwiększ białko w śniadaniu i kolacji — dzięki temu nie będziesz odczuwać ochoty na wieczorne podjadanie.");
        }

        // Analiza wagi
        if (stats.WeightChangeKg.HasValue)
        {
            var wc = stats.WeightChangeKg.Value;
            if (wc <= -0.3m && wc >= -1.0m)
            {
                weightAnalysis = $"Waga spadła o {Math.Abs(wc):F1} kg w tym okresie. To podręcznikowe, najzdrowsze tempo ubytku czystej tkanki tłuszczowej.";
            }
            else if (wc < -1.0m)
            {
                weightAnalysis = $"Waga spadła aż o {Math.Abs(wc):F1} kg. Pamiętaj, że w pierwszych tygodniach spora część to woda związana z glikogenem. W kolejnych tygodniach tempo naturalnie zwolni.";
            }
            else if (wc > 0 && stats.Goal == DietGoal.Cut)
            {
                weightAnalysis = $"Waga wskazuje lekki wzrost (+{wc:F1} kg). Nie panikuj! Wahania wagi z dnia na dzień to w 95% woda (sód, węglowodany, trening). Patrz zawsze na średnie tygodniowe.";
                recommendations.Add("Zwróć uwagę na ilość soli w kolacji i jakość snu — kortyzol potrafi zatrzymać nawet 1.5 kg wody.");
            }
            else
            {
                weightAnalysis = $"Waga zmieniła się o {(wc > 0 ? "+" : "")}{wc:F1} kg, co wskazuje na stabilizację.";
            }
        }
        else
        {
            weightAnalysis = "Brak regularnych pomiarów wagi w tym okresie. Waż się codziennie rano na czczo po toalecie — aplikacja sama wyciągnie średnią tygodniową!";
            recommendations.Add("Wprowadzaj poranną wagę chociaż 4-5 razy w tygodniu.");
        }

        if (recommendations.Count < 3)
        {
            recommendations.Add("Wypijaj minimum 2-2.5 l wody dziennie — dobre nawodnienie eliminuje fałszywy głód.");
            recommendations.Add("Stosuj zasadę 80/20: 80% nieprzetworzonego, odżywczego jedzenia, a 20% miejsca na ulubioną przekąskę bez poczucia winy.");
        }

        return new AiCoachReportDto(
            Headline: headline,
            Summary: summary,
            CalorieAnalysis: calAnalysis,
            MacroAnalysis: macroAnalysis,
            WeightTrendAnalysis: weightAnalysis,
            Recommendations: recommendations,
            AvgCalories: stats.AvgCalories,
            TargetCalories: stats.TargetCalories,
            AvgProteinGrams: stats.AvgProtein,
            TargetProteinGrams: stats.TargetProteinGrams,
            WeightChangeKg: stats.WeightChangeKg,
            LoggedDaysCount: stats.LoggedDays,
            TotalDaysInPeriod: stats.TotalDays,
            AiModelUsed: "Wbudowany asystent dietetyczny MacroGuard",
            GeneratedAtUtc: DateTime.UtcNow
        );
    }
}

