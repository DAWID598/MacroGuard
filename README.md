# MacroGuard 🥑

Aplikacja webowa do liczenia kalorii, makroskładników (Białko / Tłuszcze / Węglowodany), wyliczania zapotrzebowania kalorycznego (**BMR / TDEE** wg wzoru Mifflin-St Jeor), prowadzenia dziennika żywieniowego z podziałem na **4 posiłki** (*Śniadanie, Obiad, Przekąska, Kolacja*) oraz **inteligentnego generatora przepisów AI** (*„Nie masz pomysłu? Wygeneruj posiłek”*).

## Technologie:

- **Frontend:** Angular 19 (Standalone Components, Signals, Reactive Forms) + **Angular Material**
- **Backend:** .NET 10 Web API (**Clean Architecture**: `Domain`, `Application`, `Infrastructure`, `Api`), Entity Framework Core, ASP.NET Core Identity + JWT Bearer
- **Baza danych & Narzędzia:** PostgreSQL 17 + lokalny serwer SMTP Mailpit (Docker Compose)
- **AI Generator:** Wbudowany hybrydowy silnik kulinarny z uniwersalnym wsparciem dla każdego modelu AI: **Google Gemini**, **OpenAI (ChatGPT)**, **Anthropic Claude**, **Ollama** (lokalne modele na własnym PC) oraz **Groq / DeepSeek / Mistral**.

---

## Funkcjonalności

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
### 9. Praca Fizyczna, Trening Siłowy na Masie & Baza Wiedzy o Treningu
- **Dedykowany poziom aktywności dla pracy fizycznej (PAL = 1.6):**
  - Opcja w kalkulatorze BMR/TDEE: *„🛠️ Sama praca fizyczna bez treningów (1.6) — magazyn, budowa, kurier, gastronomia (cały dzień w ruchu)”*.
  - Eliminuje dylemat użytkowników wykonujących ciężką pracę fizyczną, którzy nie trenują na siłowni, a dotychczas musieli wybierać opcje powiązane z dniami treningowymi.
- **Wskazówki i ostrzeżenie przy budowie masy mięśniowej:**
  - Dynamiczny boks informacyjny w kalkulatorze po wybraniu celu *„Budowa masy mięśniowej”*.
  - Jasne wyjaśnienie, że nadwyżka kaloryczna bez regularnego bodźca siłowego zostanie odłożona w postaci tkanki tłuszczowej, dlatego kluczem jest trening oporowy oraz wysoka podaż białka.
- **Moduł w Bazie Wiedzy (`/guide`):**
  - Zakładka 4: **„4. Trening Siłowy & Mięśnie”** — dlaczego trening siłowy jest kluczowy na masie i redukcji, 3 filary sukcesu (Progressive Overload, Białko 1.8–2.2 g/kg, Sen 7–8h) oraz gotowy plan FBW.
  - Zakładka 5: **„5. Mity i FAQ”** — obalanie mitów o jedzeniu po 18:00, skokach wagi z dnia na dzień, owocach, kardio i zasadzie 80/20 jako naturalne podsumowanie bazy wiedzy.

### 10. Dynamiczne Dodawanie Posiłków (Więcej niż 4 posiłki w Dzienniku)
- **Przycisk „+ Dodaj kolejny posiłek” w Dzienniku:**
  - Domyślnie każdy dzień ma 4 posiłki bazowe (*Śniadanie, Obiad, Przekąska, Kolacja*).
  - W dowolnym momencie użytkownik może kliknąć **„+ Dodaj kolejny posiłek”** i wybrać z menu:
    - 🥐 **II Śniadanie**
    - 🥪 **Podwieczorek**
    - ⚡ **Posiłek przedtreningowy**
    - 🏋️ **Posiłek potreningowy**
    - 🍎 **Dodatkowy posiłek**
    - 🥤 **Napoje i Płyny**
- **Elastyczność jednorazowa vs stała:**
  - Dodany posiłek pojawia się od razu w danym dniu w porządku chronologicznym.
  - Aplikacja wyświetla powiadomienie z pytaniem *„Czy chcesz wyświetlać ten posiłek codziennie?”* z 1-kliknięciem *„Tak, codziennie”* (dla osób jedzących na co dzień 5–6 posiłków).
  - Pusty dodatkowy posiłek można w każdej chwili usunąć przyciskiem `X`.
- **Integracja w całej aplikacji:**
  - Nowe posiłki w pełni współpracują z **Generatorem Przepisów AI**, oknem **Dodawania Produktów**, funkcją **Kopiuj z wczoraj** oraz **Zapisz jako zestaw**.

### 11. Obsługa Napojów & Płynnych Kalorii
- **Baza 20 popularnych napojów i płynów:**
  - Dodano do seederów bazę artykułów: *Coca-Cola Original (10.6g cukru / 42 kcal)*, *Coca-Cola Zero (0 kcal)*, *Pepsi Max (0 kcal)*, *Pepsi*, *Fanta*, *Sprite*, *Soki 100%*, *Woda mineralna*, *Kawa czarna*, *Kawa z mlekiem*, *Latte*, *Herbaty*, *Energetyki klasyczne i Zero*, *Izotoniki*, *Piwo jasne* oraz *Piwo 0.0%*.
- **Wygodne logowanie w mililitrach (ml):**
  - W oknie dodawania produktu przy wyborze napoju jednostka zmienia się na `ml / g`, a podręczne przyciski oferują realne porcje: *150 ml (mała szklanka)*, *250 ml (szklanka)*, *330 ml (puszka)* oraz *500 ml (butelka)*.
  - Napoje można dodawać bezpośrednio do dowolnego posiłku (śniadanie, obiad itp.) lub jako dedykowany kafelek *„🥤 Napoje i Płyny”*.

### 12. Dedykowany Rozdział „Popularne Pułapki — Na Co Uważać?” & Dynamiczny Pasek Nawigacji
- **Nowy rozdział w Bazie Wiedzy (`/guide`):**
  - Zakładka 5: **„5. Pułapki Dietetyczne — Na co uważać?”** (przed Mitami i FAQ) z 5 praktycznymi kartami:
    1. *Płynne kalorie & słodzone napoje* (Coca-Cola 10.6g cukru/100ml, 140 kcal w puszce, soki, kawy smakowe vs. woda i napoje ZERO).
    2. *Olej i oliwa wlewane na patelnię „na oko”* (100–120 kcal w łyżce, ukryte 350–400 kcal na patelni vs. waga kuchenna / spray).
    3. *Zdrowe przekąski o ogromnej gęstości* (orzechy 600–650 kcal/100g, masło orzechowe 200 kcal/łyżka vs. ważenie porcji 20–25g).
    4. *Sosy, gotowe dressingi i tradycyjny majonez* (dodatkowe 300 kcal w sałatce vs. baza ze skyru/jogurtu i majonez light).
    5. *Bezwiedne podjadanie („Tylko jeden gryz”)* (300–500 kcal z niekontrolowanych kęsów vs. zasada „Co w ustach, to w Dzienniku”).
  - Zakładka 6: **„6. Mity i FAQ”** jako zwieńczenie bazy wiedzy.
- **Dynamiczny licznik posiłków w górnym menu (Navbar):**
  - Pasek nawigacji na bieżąco dostosowuje etykietę: `Dziennik (1 posiłek)`, `Dziennik (X posiłki)`, `Dziennik (X posiłków)` w zależności od aktualnie wyświetlanej liczby posiłków w dzienniku.
  - Dodanie lub usunięcie posiłku (np. *Napoje i Płyny*, *II Śniadanie*) natychmiast aktualizuje cyfrę w navbarze w czasie rzeczywistym.

---

## 🧪 Zapewnienie Jakości & Dokumentacja Testowa (QA & Testing)

Aplikacja została objęta kompleksowym procesem zapewnienia jakości (**Quality Assurance**) prowadzonym zgodnie z międzynarodowym standardem **ISTQB** (International Software Testing Qualifications Board). Projekt łączy w sobie pełną dokumentację testów manualnych, analizę ryzyka biznesowego (**Risk-Based Testing**), formalny rejestr błędów z pełnym cyklem życia defektu oraz przygotowanie do automatyzacji E2E/API w Playwright.

### 📁 Dokumentacja Testowa (`tests/docs/`)

| Dokument | Standard / Metodyka | Opis zawartości | Link |
|---|---|---|:---:|
| 📋 **Test Plan** | Standard ISTQB | Strategia testowa, matryca RBT (Risk-Based Testing), kryteria wejścia/wyjścia (Entry/Exit Criteria), zakres testów oraz architektura środowiskowa | [Zobacz dokument](tests/docs/TEST_PLAN.md) |
| 📑 **Test Cases** | ISTQB Test Specification | Specyfikacja **24 precyzyjnych przypadków testowych** (P0–P2) z warunkami wstępnymi, krokami i oczekiwanym rezultatem (20 wytypowanych do automatyzacji) | [Zobacz przypadki](tests/docs/TEST_CASES.md) |
| 📊 **Execution Report** | Test Summary Report | Raport z manualnego wykonania testów: **24 / 24 PASS (100% zaliczenia)**, metryki, log z wykonania oraz formalny Release Sign-Off | [Zobacz raport](tests/docs/TEST_CASES_EXECUTION_REPORT.md) |
| 🐞 **Bug Reports** | Defect Lifecycle Log | Rejestr **5 rzeczywistych defektów** (`BUG-001` do `BUG-005`) z pełną ścieżką: kroki odtworzenia, analiza przyczyny źródłowej, re-testy i status 🟢 CLOSED | [Zobacz defekty](tests/docs/BUG_REPORTS.md) |

### 📊 Metryki Jakościowe (Stan na Październik 2026)

* **🟩 Automatyczne Testy Jednostkowe (.NET 10 / xUnit):** **`32 / 32 PASS (100%)`** w czasie **`~0.1 s`**
  * `BmrCalculatorTests`: 14 testów (Mifflin-St Jeor dla M/K, współczynniki PAL, cel redukcji/masy, flaga `IsBelowBmr`)
  * `MealEntryNutritionTests`: 8 testów (przeliczanie porcji w gramach i płynów w mililitrach, zaokrąglanie, ochrona przed null)
  * `ValidationAttributesTests`: 10 testów (odrzucenie ujemnych gramatur `BUG-005`, BVA 1g/5000g, polityka haseł `TC-AUTH-002`)
* **📋 Testy Manualne (ISTQB):** **`24 / 24 PASS (100% zaliczenia)`**
  * 🔴 **Krytyczne (P0 Smoke):** `5 / 5 (100% PASS)`
  * 🟡 **Biznesowe (P1 Functional):** `16 / 16 (100% PASS)`
  * 🔵 **Normalne (P2 Regresja):** `3 / 3 (100% PASS)`
* **Wykryte i naprawione defekty:** `5` (wszystkie zweryfikowane w re-testach i zamknięte)
* **Środowisko testów manualnych:** Windows 10 Home 64-bit | Google Chrome 155.0 (Desktop 1920x1080) | Emulacja mobilna DevTools: Samsung Galaxy S20 Ultra (412x915)

### 🚀 Automatyzacja Testów & Piramida Jakości (57/57 PASS)
Projekt posiada kompletną, 3-poziomową piramidę testów automatycznych ze 100% wskaźnikiem powodzenia:
* **Unit Tests (.NET 10 / xUnit + FluentAssertions):** 32 testy weryfikujące formuły BMR/TDEE (Mifflin-St Jeor), współczynniki PAL, skalowanie makroskładników oraz reguły walidacji.
* **API Integration Tests (Playwright + TypeScript):** 17 testów badających REST API, autentykację JWT, tokeny aktywacyjne via Mailpit SMTP API oraz ochronę przed atakami Brute Force (HTTP 423 Locked).
* **End-to-End E2E Tests (Playwright + Page Object Model):** 8 testów w przeglądarce Chromium weryfikujących krytyczne ścieżki użytkownika (rejestracja i aktywacja konta, live walidacja haseł, strażnicy AuthGuard, dziennik żywieniowy i wykresy SVG wagi).

---

## 🔄 CI/CD Pipeline & Quality Gates

W projekcie wdrożono dwupoziomowy mechanizm ciągłej integracji i kontroli jakości (Quality Gate):

### 1. Lokalny Git Pre-Commit Hook ([scripts/hooks/pre-commit](scripts/hooks/pre-commit))
Każde polecenie git commit automatycznie wywołuje skrypt weryfikacyjny:
* **Blokada wadliwego kodu:** Jeśli testy zakończą się błędem (exit 1), Git natychmiast anuluje zatwierdzenie commita, uniemożliwiając wprowadzenie regresji do repozytorium.
* **Włączenie hooka w repozytorium:**
  ```powershell
git config core.hooksPath scripts/hooks
``

### 2. Skrypt symulacji CI/CD ([./scripts/run-ci.ps1](scripts/run-ci.ps1))
Umożliwia uruchomienie całego pipeline'u weryfikacyjnego jednym poleceniem z poziomu konsoli:
```powershell
# Pełny pipeline (Unit -> API -> E2E):
./scripts/run-ci.ps1

# Szybki test jednostkowy (Fast Quality Gate):
./scripts/run-ci.ps1 -Quick
``

### 3. GitHub Actions Cloud CI/CD ([.github/workflows/ci.yml](.github/workflows/ci.yml))
Przy każdym git push lub Pull Request na gałąź main, GitHub Actions automatycznie uruchamia w chmurze (Ubuntu):
1. Usługi bazodanowe (kontenery Docker: PostgreSQL 17 + Mailpit).
2. Środowisko .NET 10 oraz Node.js 22.
3. Testy jednostkowe xUnit.
4. Kompilację i start backendu oraz frontendu.
5. Testy integracyjne API oraz E2E w Playwright Chromium.
6. Publikację artefaktów (raport HTML Playwright) w razie wykrycia problemów.

---

## Szybki Start

### 1. Skonfiguruj plik środowiskowy (`.env`)
Plik `.env` zawiera poświadczenia do bazy danych i ze względów bezpieczeństwa nie jest commitowany do repozytorium.

1. Skopiuj szablon przygotowany w projekcie:
````powershell
cp .env.example .env
```
2. Otwórz utworzony plik `.env` i w polu `POSTGRES_PASSWORD` **ustal własne hasło do bazy danych** (np. `POSTGRES_PASSWORD=twoje_bezpieczne_haslo`). Wartości `POSTGRES_USER=macroguard` oraz `POSTGRES_DB=macroguard_db` pozostaw bez zmian.

### 2. Uruchom usługi Docker (PostgreSQL 17 + serwer pocztowy Mailpit)
Upewnij się, że aplikacja **Docker Desktop** jest włączona, a następnie w głównym katalogu uruchom:
````powershell
docker compose up -d
```
> Lokalna skrzynka pocztowa **Mailpit** jest dostępna w przeglądarce pod adresem: `http://localhost:8025`. Trafiają tam wszystkie e-maile z resetem hasła wysyłane przez aplikację — **działa od strzała dla każdego bez konfiguracji**!

### 3. Uruchom Backend (.NET 10 API)
Przy pierwszym uruchomieniu API automatycznie utworzy tabele w bazie PostgreSQL i wypełni bazę 75+ popularnymi produktami spożywczymi (mięsa, ryby, nabiał, warzywa, owoce, orzechy oraz tłuszcze i oleje):
````powershell
dotnet run --project backend/src/MacroGuard.Api
```
Backend nasłuchuje pod adresem: `http://localhost:5000`

### 4. Uruchom Frontend (Angular + Angular Material)
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

### 5. Uruchom Testy Jednostkowe (.NET 10 / xUnit)
Wszystkie 32 testy jednostkowe uruchomisz jednym poleceniem z poziomu głównego katalogu:
````powershell
dotnet test backend/tests/MacroGuard.UnitTests/MacroGuard.UnitTests.csproj
```

### 6. Uruchom Testy Integracyjne API (Playwright + TypeScript)
Wszystkie 17 testów integracyjnych API (weryfikujących REST API, bazę PostgreSQL, tokeny JWT oraz integrację SMTP Mailpit) uruchomisz poleceniem:
````powershell
npm --prefix tests run test:api
```
*(Wymaga uruchomionych usług Docker oraz działającego backendu na porcie 5000).*

### 7. Uruchom Testy End-to-End E2E (Playwright + Page Object Model)
Wszystkie 8 testów E2E w przeglądarce Chromium (weryfikujących rejestrację, odebranie maila z Mailpita, aktywację konta, logowanie, obliczenia w kalkulatorze BMR/TDEE, dodawanie i usuwanie posiłków w dzienniku oraz interaktywny wykres wagi SVG) uruchomisz poleceniem:
````powershell
npm --prefix tests run test:e2e
```
*(Wymaga uruchomionych usług Docker, backendu na porcie 5000 oraz frontendu na porcie 4200).*

### 8. Podgląd Raportu HTML z Testów
Po wykonaniu testów Playwright możesz otworzyć interaktywny raport HTML z krokami, zrzutami ekranu i czasem wykonania:
````powershell
npm --prefix tests run report
```


