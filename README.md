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

### 2. Przewodnik Żywieniowy & Baza Wiedzy (Edukacja od A do Z)
- **Kompleksowa strefa wiedzy dla każdego:** Napisana prostym, przystępnym, ludzkim językiem bez trudnego żargonu medycznego.
- **Kalorie i Bilans:** Objaśnienie jak działa metabolizm (BMR, TDEE) oraz dlaczego głodówki niszczą sylwetkę, a zdrowy deficyt daje trwałe rezultaty.
- **Makroskładniki (B/W/T):** Szczegółowe omówienie roli białka (król sytości i ochrona mięśni), węglowodanów (energia dla mózgu i ruchu) oraz tłuszczów (zdrowie hormonalne).
- **Poradnik w 4 Krokach:** Praktyczna instrukcja jak korzystać z wagi kuchennej, kalkulatora i dziennika.
- **Interaktywne FAQ i Obalanie Mitów:** Jedzenie po 18:00, wahania wagi z dnia na dzień, mit owoców, zasada 80/20.

### 3. Waga & Statystyki Postępów (Rejestracja porannej wagi i wykresy)
- **Opcjonalna rejestracja porannej wagi:** Formularz z precyzyjną regulacją przyciskami `+/- 0.1 kg` oraz `+/- 0.5 kg`, polem notatki i automatyczną aktualizacją bieżącej wagi w profilu.
- **Wykresy i realne trendy (SVG):** Interaktywny wykres liniowy z cieniowanym gradientem, punktami pomiarowymi z podpowiedziami (tooltips) i filtrami czasowymi: *14 dni*, *30 dni*, *90 dni* oraz *Wszystkie*.
- **Średnie tygodniowe (Eliminacja szumu wody):** Prezentacja kluczowego wskaźnika redukcji/masy — porównanie średniej z bieżącego tygodnia z poprzednim tygodniem (*„Waga skacze z dnia na dzień przez sól i wodę — patrz na średnie tygodniowe”*).
- **Karty metryk KPI:** Ostatnia waga, Całkowity postęp od startu, Średnia w tym tygodniu oraz Tempo zmian tydzień do tygodnia z oceną.
- **Historia i edycja:** Tabela zarejestrowanych pomiarów z możliwością usuwania wpisów.

### 4. Błyskawiczne Kopiowanie Posiłków („Kopiuj z wczoraj”)
- **Kopiowanie pojedynczego posiłku:** Przycisk `Kopiuj z wczoraj` przy każdym posiłku (Śniadanie, Obiad, Przekąska, Kolacja) w dzienniku. Za jednym kliknięciem przenosi wszystkie produkty z danego posiłku z dnia poprzedniego — bez konieczności ponownego wyszukiwania i wpisywania gramatur.

### 5. Moje Zestawy Dań („Ulubione Posiłki / Zestawy”)
- **Tworzenie zestawu z dziennika:** Przycisk `Zapisz jako zestaw` przy dowolnym posiłku z dziennika — wystarczy wpisać własną nazwę (np. *„Moja standardowa owsianka”*, *„Kurczak z ryżem i brokułem”*), a zestaw zostaje trwale zapisany w bazie danych wraz z gramaturami produktów i przeliczonymi makroskładnikami.
- **Dodawanie zestawu w 1 kliknięcie:** W oknie dodawania posiłku pojawiła się nowa zakładka **„🍱 Moje Zestawy”**. Prezentuje listę utworzonych dań, ich całkowite kalorie i makro, szczegółową listę składników oraz przyciski natychmiastowego wstawienia (`Wstaw ten zestaw`) i usuwania.

### 6. MacroGuard AI Coach (Analiza Postępów & Rekomendacje)
- **Kompleksowa analiza sylwetkowa:** Dostępna w widoku *Waga & Postępy* z przełącznikiem okresu **Ostatnie 7 dni** vs **Ostatnie 30 dni**.
- **Weryfikacja bilansu i nawyków:** Porównuje realną średnią kaloryczność ze zdefiniowanym celem TDEE/deficytu/nadwyżki, sprawdza pokrycie zapotrzebowania na białko (g/kg masy ciała) oraz zestawia bilans energetyczny z rzeczywistym ruchem wagi porannej.
- **Konkretne rekomendacje krok po kroku:** Wskazuje 3-4 precyzyjne zalecenia dietetyczno-treningowe dopasowane do aktualnej fazy (redukcja, masa, rekompozycja, utrzymanie).
- **Uniwersalność AI i praca offline:** Działa w oparciu o skonfigurowany model LLM (Google Gemini, OpenAI, Claude, Ollama), a w razie braku klucza API przełącza się automatycznie na **inteligentny algorytm kulinarno-dietetyczny offline**.

### 7. Raporty Okresowe & Eksport do PDF
- **Dostęp z Dziennika i Statystyk:** Przycisk `Raport PDF` dostępny w nagłówku Dziennika oraz w zakładce Waga & Postępy.
- **Podsumowanie okresu:** Błyskawiczny wybór raportu za **Ostatnie 7 dni** lub **Ostatnie 30 dni**.
- **Karty wskaźników KPI:** Realizacja celów kalorii, białka, tłuszczów i węglowodanów, średnie dzienne spożycie oraz zmiana wagi.
- **Szczegółowa tabela dzień po dniu:** Podsumowanie każdego dnia z kolorystycznym wyróżnieniem bilansu i zjedzonych makroskładników.
- **Gotowy szablon do druku i zapisu PDF:** Układ `@media print` sformatowany pod stronę A4 bez niepotrzebnych pasków przewijania czy elementów UI — przycisk `Drukuj / Zapisz jako PDF` wywołuje systemowy podgląd wydruku.

### 8. Konfiguracja Celów Odchudzania & Wagi Docelowej
- **Docelowa masa ciała (kg):** Możliwość określenia docelowej wagi (np. *80 kg ➔ 72 kg*, „Cel: zrzucić 8 kg”).
- **Wybór tempa odchudzania i deficytu:**
  - *Łagodne* (-10% / ~0.25 - 0.3 kg/tydz) — bez uczucia głodu, wysoki komfort
  - *Standardowe* (-15% / ~0.50 kg/tydz) — złoty standard dietetyki, ochrona mięśni
  - *Dynamiczne* (-20% / ~0.75 kg/tydz) — szybsza redukcja, wyraźny deficyt
  - *Mocne* (-25% / ~1.00 kg/tydz) — maksymalny bezpieczny limit
  - *Własny %* — możliwość wpisania dowolnego cięcia kalorii (5% – 35%)
- **Prognoza osiągnięcia celu:** Szacowany czas w tygodniach i miesiącach oraz orientacyjny termin osiągnięcia wymarzonej sylwetki.
- **Ochrona metabolizmu:** Ostrzeżenie, jeśli wybrane tempo redukcji schodzi poniżej BMR (podstawowej przemiany materii).
- **Banner w widoku Waga & Postępy:** Dynamiczny kafelek pokazujący ile kg pozostało do osiągnięcia celu wraz z szybkim przejściem do edycji.

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

