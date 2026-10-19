# Rejestr Raportów Błędów (Defect Reports Portfolio)
## Projekt: MacroGuard — System Zarządzania Błędami (Zgodny ze standardem ISTQB)


| **Autor:** | Dawid (Junior QA Automation Engineer) |
| **System śledzenia defektów:** | Symulacja Jira Software / GitHub Issues |
| **Środowisko testowe:** | Windows 10 Home 64-bit \| Google Chrome 155.0.8059.80 |
| **Status zbiorczy:** | 5 zgłoszonych defektów \| 5 naprawionych i zweryfikowanych (100% CLOSED) |

---

## 1. Tabela Zbiorcza Rejestru Defektów (Defect Log Matrix)

| ID | Tytuł defektu | Waga (Severity) | Priorytet | Moduł | Status |
|---|---|---|---|---|---|
| `BUG-001` | Brak reaktywnej aktualizacji licznika posiłków w navbarze | `S3 - Major` | `P2` | `DIARY` | 🟢 CLOSED |
| `BUG-002` | Pominięcie weryfikacji e-mail i natychmiastowe wydanie tokenu JWT | `S1 - Blocker` | `P0` | `AUTH` | 🟢 CLOSED |
| `BUG-003` | Brak potwierdzenia przed masowym usunięciem pozycji z posiłku | `S2 - Critical` | `P1` | `DIARY` | 🟢 CLOSED |
| `BUG-004` | Przepełnienie nagłówka posiłku i ucięcie przycisków na telefonach | `S3 - Major` | `P2` | `RWD` | 🟢 CLOSED |
| `BUG-005` | Brak walidacji ujemnej gramatury w formularzu dodawania produktu | `S2 - Critical` | `P1` | `API` | 🟢 CLOSED |

---

## 2. Szczegółowe Raporty Błędów

### Raport Defektu 1: [BUG-001] Brak dynamicznej aktualizacji licznika posiłków w nagłówku po dodaniu nowego posiłku

* **Identyfikator:** `BUG-001`
* **Status:** 🟢 **CLOSED / RESOLVED** (Naprawiony i zweryfikowany w re-testach)
* **Powiązany przypadek testowy:** `TC-DIARY-006`
* **Waga (Severity):** `S3 - Major` (Błąd spójności danych UI)
* **Priorytet (Priority):** `P2 - Normal`
* **Środowisko:** Windows 10 Home 64-bit | Google Chrome 155.0.8059.80 | Angular 19 SPA
* **Komponent:** `NavbarComponent` / `DiaryComponent` / `DiaryStateService`

#### Opis problemu:
Po kliknięciu przycisku *„+ Dodaj kolejny posiłek”* i wybraniu np. *„II Śniadanie”*, nowy posiłek pojawia się na liście dziennika, jednak etykieta w górnym pasku nawigacyjnym w dalszym ciągu wyświetla wartość statyczną `Dziennik (4 posiłki)` zamiast `Dziennik (5 posiłków)`. Licznik aktualizował się dopiero po ręcznym odświeżeniu strony klawiszem F5.

#### Kroki do odtworzenia (Steps to Reproduce):
1. Zaloguj się do aplikacji i przejdź do widoku Dziennika (`/diary`).
2. Zaobserwuj etykietę w górnym pasku nawigacyjnym: wskazuje `Dziennik (4 posiłki)`.
3. Zjedź na dół strony i kliknij przycisk **„+ Dodaj kolejny posiłek”**.
4. Wybierz z menu rozwijanego pozycję **„II Śniadanie”**.
5. Zaobserwuj stan etykiety w górnym pasku menu bez odświeżania strony.

#### Wynik rzeczywisty (Actual Result):
W widoku dziennika widnieje 5 posiłków, ale górny pasek nawigacji nadal wyświetla tekst `Dziennik (4 posiłki)`.

#### Wynik oczekiwany (Expected Result):
Pasek nawigacji powinien być reaktywny (Angular Signal / State Service) i natychmiast zaktualizować tekst na `Dziennik (5 posiłków)` wraz z poprawną odmianą gramatyczną w języku polskim.

#### Przyczyna źródłowa & Rozwiązanie (Root Cause & Fix):
Komponent `NavbarComponent` odczytywał liczbę posiłków ze statycznej wartości początkowej zamiast subskrybować sygnał `computed` z serwisu współdzielonego `DiaryStateService`. Wprowadzono reaktywny sygnał `diaryNavLabel()`.

---

### Raport Defektu 2: [BUG-002] Możliwość logowania bez weryfikacji adresu e-mail i natychmiastowe wystawienie tokenu JWT

* **Identyfikator:** `BUG-002` (Krytyczna Podatność Bezpieczeństwa)
* **Status:** 🟢 **CLOSED / RESOLVED** (Załatana luka bezpieczeństwa)
* **Powiązany przypadek testowy:** `TC-AUTH-001`, `TC-AUTH-003`
* **Waga (Severity):** `S1 - Blocker / Security Critical`
* **Priorytet (Priority):** `P0 - Blocker`
* **Środowisko:** Backend .NET 10 Web API / ASP.NET Core Identity
* **Komponent:** `AuthService.RegisterAsync` / `AuthController`

#### Opis problemu:
Endpoint `POST /api/auth/register` po pomyślnym utworzeniu rekordu użytkownika w bazie natychmiast generował i zwracał pełnoprawny token JWT z uprawnieniami dostępu. Użytkownik mógł korzystać z całej aplikacji podając cudzy lub fikcyjny adres e-mail, bez potwierdzenia jego posiadania.

#### Kroki do odtworzenia:
1. Wyślij żądanie `POST /api/auth/register` z danymi nowego użytkownika.
2. Przeanalizuj odpowiedź serwera.

#### Wynik rzeczywisty:
Serwer zwracał status HTTP `200 OK` z obiektem `AuthResponse` zawierającym ważny token JWT (`token: "eyJhbGciOi..."`). Konto otrzymywało natychmiastowy dostęp do zasobów chronionych bez aktywacji.

#### Wynik oczekiwany:
Serwer powinien utworzyć konto z flagą `EmailConfirmed = false`, wysłać unikalny token aktywacyjny na podany adres e-mail i zwrócić komunikat informacyjny `RegisterResponse` **bez tokenu JWT**. Logowanie powinno być zablokowane kodem HTTP `403 Forbidden` do momentu aktywacji przez link w Mailpit.

#### Przyczyna źródłowa & Rozwiązanie:
Usunięto automatyczne wywołanie `jwtService.GenerateToken` z metody rejestracji. Dodano middleware sprawdzający flagę `EmailConfirmed` przy próbie logowania oraz obsługę statusu `403 Forbidden` w formularzu logowania.

---

### Raport Defektu 3: [BUG-003] Brak mechanizmu potwierdzenia przed masowym usunięciem wszystkich pozycji z posiłku

* **Identyfikator:** `BUG-003`
* **Status:** 🟢 **CLOSED / RESOLVED** (Naprawiony i zweryfikowany w re-testach)
* **Powiązany przypadek testowy:** `TC-DIARY-004`, `TC-DIARY-005`
* **Waga (Severity):** `S2 - Critical` (Ryzyko nieodwracalnej utraty danych użytkownika)
* **Priorytet (Priority):** `P1 - High`
* **Środowisko:** Windows 10 Home 64-bit | Google Chrome 155.0.8059.80 | Web UI
* **Komponent:** `DiaryComponent.clearAllEntriesFromMeal`

#### Opis problemu:
Przycisk czyszczenia posiłku usuwał wszystkie zaplanowane produkty natychmiast po pojedynczym kliknięciu, bez wyświetlenia okna dialogowego z pytaniem o potwierdzenie. Na ekranach dotykowych lub przy przypadkowym kliknięciu użytkownik bezpowrotnie tracił wszystkie wprowadzone składniki posiłku.

#### Kroki do odtworzenia:
1. Dodaj 3 produkty do posiłku Obiad.
2. Kliknij przycisk z ikoną miotełki w nagłówku posiłku.

#### Wynik rzeczywisty:
Wszystkie pozycje były natychmiast usuwane z bazy danych bez żadnego dialogu potwierdzającego.

#### Wynik oczekiwany:
Przycisk powinien wywoływać okno potwierdzenia z informacją o nazwie posiłku i liczbie usuwanych pozycji:
> *„Czy na pewno chcesz usunąć wszystkie pozycje (3 pozycje) z posiłku "Obiad"? Tej operacji nie można cofnąć.”*
Dopiero kliknięcie *OK* wysyła żądanie `DELETE /api/diary/clear-meal`. Kliknięcie *Anuluj* pozostawia dane bez zmian.

#### Przyczyna źródłowa & Rozwiązanie:
Wprowadzono modalne okno dialogowe `window.confirm` weryfikujące intencję użytkownika przed wysłaniem żądania sieciowego.

---

### Raport Defektu 4: [BUG-004] Przepełnienie nagłówka posiłku i ucięcie przycisków akcji na ekranach mobilnych (Galaxy S20)

* **Identyfikator:** `BUG-004`
* **Status:** 🟢 **CLOSED / RESOLVED** (Naprawiony i zweryfikowany poprawką CSS)
* **Wykryto podczas:** Testy eksploracyjne i weryfikacja RWD na urządzeniach mobilnych
* **Waga (Severity):** `S3 - Major` (Niedostępność części przycisków na telefonach)
* **Priorytet (Priority):** `P2 - Normal`
* **Środowisko:**
  - Urządzenie testowe: Samsung Galaxy S20 Ultra (412x915)
  - Przeglądarka: Google Chrome Mobile Emulation 155.0.8059.80
* **Komponent:** `DiaryComponent` (style `.meal-actions`)

#### Opis problemu:
W widokach mobilnych o szerokości poniżej `450px`, nagłówek posiłku zawierający tytuł, makroskładniki oraz 5 przycisków akcji (`+ Dodaj`, `AI Pomysł`, czyszczenie, zapis zestawu, kopiowanie z wczoraj) przekraczał dostępną szerokość ekranu z powodu reguły `flex-shrink: 0`. Przyciski po prawej stronie były obcinane przez prawą krawędź ekranu i częściowo niedostępne dla użytkownika.

#### Kroki do odtworzenia:
1. Otwórz Chrome DevTools (`F12`) i włącz tryb emulacji mobilnej (`Ctrl + Shift + M`).
2. Ustaw widok **Samsung Galaxy S20 (412px)**.
3. Przejdź do Dziennika (`/diary`) na posiłek zawierający dodane pozycje.
4. Zaobserwuj prawe krawędzie nagłówka posiłku.

#### Wynik rzeczywisty:
Przyciski akcji wychodziły poza obszar karty i były częściowo obcięte.

#### Wynik oczekiwany:
Pasek akcji `.meal-actions` na ekranach mobilnych poniżej `520px` powinien automatycznie przenosić się do nowego wiersza (`flex-wrap: wrap; width: 100%`), zapewniając pełną widoczność wszystkich przycisków.

#### Przyczyna źródłowa & Rozwiązanie:
Dodano regułę `flex-wrap: wrap` oraz media query `@media (max-width: 520px)` dla kontenera `.meal-actions`, co pozwoliło na estetyczne ułożenie przycisków bez obcinania elementów.

---

### Raport Defektu 5: [BUG-005] Brak walidacji ujemnej gramatury w formularzu dodawania produktu do posiłku

* **Identyfikator:** `BUG-005`
* **Status:** 🟢 **CLOSED / RESOLVED** (Załatana reguła walidacji biznesowej)
* **Powiązany przypadek testowy:** `TC-DIARY-001`
* **Waga (Severity):** `S2 - Critical` (Zaburzenie integralności matematycznej bilansu kalorii)
* **Priorytet (Priority):** `P1 - High`
* **Środowisko:** Backend ASP.NET Core Web API / Frontend Angular
* **Komponent:** `AddEntryDialogComponent` / `CreateDiaryEntryCommandValidator`

#### Opis problemu:
Formularz dodawania produktu do posiłku w pole gramatury akceptował wartości ujemne (np. `-150 g`) lub wartość zero (`0 g`). Wpisanie wartości ujemnej powodowało odjęcie kalorii z dziennika i sztuczne fałszowanie bilansu energetycznego przez użytkownika.

#### Kroki do odtworzenia:
1. Otwórz modal dodawania produktu przy posiłku *Śniadanie*.
2. Wybierz dowolny produkt (np. Jajko).
3. W pole gramatury wpisz wartość `-100`.
4. Kliknij przycisk zatwierdzenia.

#### Wynik rzeczywisty:
Aplikacja dodawała wpis z ujemną wartością kalorii (np. `-143 kcal`), co powodowało spadek dziennego spożycia kalorii zamiast jego wzrostu.

#### Wynik oczekiwany:
Pole gramatury musi posiadać walidację `min="1"` na poziomie formularza HTML/Angular oraz restrykcyjną walidację w backendzie (`RuleFor(x => x.Grams).GreaterThan(0)`). Przycisk dodania powinien być zablokowany przy gramaturze $\le 0$.

#### Przyczyna źródłowa & Rozwiązanie:
Wdrożono walidator FluentValidation w backendzie odrzucający gramatury $\le 0$ kodem HTTP `400 Bad Request` oraz dodano `Validators.min(1)` w formularzu reaktywnym frontendu.
