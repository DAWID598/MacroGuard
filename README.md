# MacroGuard 

Aplikacja webowa do liczenia kalorii, makroskładników (Białko / Tłuszcze / Węglowodany), wyliczania zapotrzebowania kalorycznego (**BMR / TDEE** wg wzoru Mifflin-St Jeor), prowadzenia dziennika żywieniowego z podziałem na **4 posiłki** (*Śniadanie, Obiad, Przekąska, Kolacja*) oraz **inteligentnego generatora przepisów AI** (*„Nie masz pomysłu? Wygeneruj posiłek”*).

## Stos Technologiczny

- **Frontend:** Angular 19 (Standalone Components, Signals, Reactive Forms) + **Angular Material**
- **Backend:** .NET 10 Web API (**Clean Architecture**: `Domain`, `Application`, `Infrastructure`, `Api`), Entity Framework Core, ASP.NET Core Identity + JWT Bearer
- **Baza danych & Narzędzia:** PostgreSQL 17 + lokalny serwer SMTP Mailpit (Docker Compose)
- **AI Generator:** Wbudowany hybrydowy silnik kulinarny z uniwersalnym wsparciem dla każdego modelu AI: **Google Gemini**, **OpenAI (ChatGPT)**, **Anthropic Claude**, **Ollama** (lokalne modele na własnym PC) oraz **Groq / DeepSeek / Mistral**.

---

## Nowe Funkcjonalności

### 1. Inteligentny Generator Posiłków AI (Uniwersalne Wsparcie dla Każdego Modelu)
- **Wybór i prezentacja modelu na żywo:** Aplikacja automatycznie wykrywa skonfigurowany model i **wyświetla jego nazwę w oknie generatora oraz na karcie przepisu** (np. `OpenAI (gpt-4o-mini)`, `Google Gemini (gemini-1.5-flash)`, `Anthropic Claude`, `Ollama` lub `Wbudowany silnik kulinarny MacroGuard`).
- Przycisk **„Nie masz pomysłu? Wygeneruj posiłek”** w nagłówku Dziennika oraz dedykowany przycisk **„AI Pomysł”** przy każdym z 4 posiłków.
- Podpowiada pozostałe do zjedzenia kalorie w danym dniu.
- Szybkie preferencje kulinarne (np. *Wysokobiałkowy*, *Szybki < 15 min*, *Na słodko*, *Keto*, *Wegetariański*) oraz pole na dowolne składniki z lodówki.
- Generuje przepis z czasem przygotowania, gramaturami składników, makro i instrukcją krok po kroku.
- **1-kliknięcie „Dodaj ten posiłek do dziennika”**: automatycznie tworzy brakujące pozycje w bazie produktów i dodaje składniki do wybranego posiłku użytkownika.
- **Jak podpiąć dowolne AI w [`appsettings.json`](backend/src/MacroGuard.Api/appsettings.json):**
  ```json
  "Ai": {
    "Provider": "Auto",    // "Auto" | "OpenAI" | "Gemini" | "Claude" | "Ollama" | "OpenAiCompatible"
    "ApiKey": "TWÓJ_KLUCZ", // klucz api od OpenAI, Google lub Anthropic
    "Model": "",           // opcjonalnie: "gpt-4o-mini", "gemini-1.5-flash", "claude-3-5-sonnet", itp.
    "BaseUrl": ""          // opcjonalnie: dla Ollama "http://localhost:11434/v1" lub Groq / DeepSeek
  }
  ```
  *(Jeśli pole `ApiKey` i `BaseUrl` pozostaną puste, generator automatycznie korzysta z wbudowanego kulinarnego silnika MacroGuard offline).*

---

## Szybki Start

### 1. Uruchom usługi Docker (PostgreSQL 17 + serwer pocztowy Mailpit)
Upewnij się, że aplikacja **Docker Desktop** jest włączona, a następnie w głównym katalogu uruchom:
```powershell
docker compose up -d
```
> [!TIP]
> Lokalna skrzynka pocztowa **Mailpit** jest dostępna w przeglądarce pod adresem: `http://localhost:8025`. Trafiają tam wszystkie e-maile z resetem hasła wysyłane przez aplikację — **działa od strzała dla każdego bez konfiguracji**!

### 2. Uruchom Backend (.NET 10 API)
Przy pierwszym uruchomieniu API automatycznie utworzy tabele w bazie PostgreSQL i wypełni bazę 75+ popularnymi produktami spożywczymi (mięsa, ryby, nabiał, warzywa, owoce, orzechy oraz tłuszcze i oleje):
```powershell
dotnet run --project backend/src/MacroGuard.Api
```
Backend nasłuchuje pod adresem: `http://localhost:5000`

### 3. Uruchom Frontend (Angular + Angular Material)
Przejdź do folderu `frontend`, zainstaluj zależności (przy pierwszym uruchomieniu po sklonowaniu repozytorium) i wystartuj serwer deweloperski:

```bash
cd frontend
npm install    # tylko przy pierwszym pobraniu projektu
npm start      # lub: ng serve
```

Alternatywnie z poziomu głównego katalogu (działa identycznie na Windows, Linux i macOS):
```bash
npm --prefix frontend start
```

Aplikacja będzie dostępna w przeglądarce pod adresem: `http://localhost:4200`

