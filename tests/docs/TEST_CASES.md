# Spis Przypadków Testowych (Test Cases Specification)
## Projekt: MacroGuard — Dziennik Żywieniowy & Kalkulator BMR/TDEE


| Metryka / Parametr | Wartość |
|:---|:---|
| **Autor dokumentu:** | Dawid (Junior QA Automation Engineer) |
| **Łączna liczba przypadków:** | 24 przypadki testowe (P0: 5, P1: 16, P2: 3, P3: 0) |
| **Kwalifikacja do automatyzacji:** | 20 przypadków dedykowanych do automatyzacji (Playwright) |

---

## Legenda Oznaczeń

* **Priorytety:**
  - **P0 (Krytyczny / Smoke):** Kluczowy przepływ systemu, bez którego aplikacja nie może działać.
  - **P1 (Wysoki / Regression):** Istotne reguły walidacji, bezpieczeństwa i kalkulacji żywieniowych.
  - **P2 (Średni / Normal):** Funkcje pomocnicze, szablony, generatory przepisów, filtry.
  - **P3 (Niski / Minor):** Drobne aspekty wizualne, treści statyczne, rzadkie ścieżki.
* **Typy testów:** `Pozytywny`, `Negatywny`, `Bezpieczeństwo`, `UI/UX`, `RWD`.
* **Status automatyzacji:** 🤖 Do automatyzacji (E2E / API) | ✋ Manualny.

---

## Spis Treści
1. [Moduł 1: Uwierzytelnianie, Autoryzacja & Bezpieczeństwo (AUTH)](#1-moduł-uwierzytelnianie-autoryzacja--bezpieczeństwo-auth)
2. [Moduł 2: Profil & Kalkulator BMR / TDEE (CALC)](#2-moduł-profil--kalkulator-bmr--tdee-calc)
3. [Moduł 3: Dziennik Żywieniowy & Obsługa Posiłków (DIARY)](#3-moduł-dziennik-żywieniowy--obsługa-posiłków-diary)
4. [Moduł 4: Baza Produktów Spożywczych (FOOD)](#4-moduł-baza-produktów-spożywczych-food)
5. [Moduł 5: Własne Dania & Generator AI (SETS / AI)](#5-moduł-własne-dania--generator-ai-sets--ai)
6. [Moduł 6: Monitorowanie Wagi & Postępy (WGHT)](#6-moduł-monitorowanie-wagi--postępy-wght)
7. [Moduł 7: Raporty Okresowe & AI Coach (REP / COACH)](#7-moduł-raporty-okresowe--ai-coach-rep--coach)

---

## 1. Moduł: Uwierzytelnianie, Autoryzacja & Bezpieczeństwo (AUTH)

### `TC-AUTH-001`: Poprawna rejestracja nowego konta z wysyłką linku aktywacyjnego
* **Priorytet:** `P0`
* **Typ testu:** Pozytywny
* **Status automatyzacji:** 🤖 Do automatyzacji (E2E + API)
* **Warunki wstępne:** Użytkownik nie posiada konta o adresie `jan.nowak@example.com`. Kontener skrzynki pocztowej Mailpit jest uruchomiony na porcie `8025`.
* **Kroki:**
  1. Wejdź na stronę główną `/auth`.
  2. Przejdź do zakładki **Rejestracja**.
  3. Wypełnij formularz danymi:
     - Imię / pseudonim: `Jan Nowak`
     - Adres e-mail: `jan.nowak@example.com`
     - Hasło: `MacroGuard2026!`
  4. Kliknij przycisk **„Utwórz darmowe konto”**.
* **Oczekiwany rezultat:**
  - Formularz rejestracji znika, pojawia się karta z komunikatem: *„Sprawdź swoją skrzynkę e-mail! Na adres jan.nowak@example.com wysłaliśmy wiadomość z linkiem aktywacyjnym”*.
  - Token JWT **nie jest** zapisywany w `localStorage` (brak automatycznego logowania).
  - W serwisie Mailpit (`http://localhost:8025`) pojawia się wiadomość e-mail z tematem *„MacroGuard — Aktywuj swoje konto”* zawierająca link z tokenem.

---

### `TC-AUTH-002`: Walidacja restrykcyjnej polityki haseł w czasie rzeczywistym
* **Priorytet:** `P1`
* **Typ testu:** Negatywny (Klasy równoważności + BVA)
* **Status automatyzacji:** 🤖 Do automatyzacji (E2E)
* **Warunki wstępne:** Użytkownik znajduje się w zakładce Rejestracja (`/auth`). Pole hasła jest puste.
* **Kroki:**
  1. Sprawdź, czy panel wymagań hasła (`.password-criteria-box`) jest ukryty przy pustym polu.
  2. Wpisz hasło o długości 9 znaków niespełniające kryteriów: `abc123!A`.
  3. Obserwuj wskaźniki spełnienia kryteriów pod polem.
  4. Spróbuj kliknąć przycisk **„Utwórz darmowe konto”**.
* **Oczekiwany rezultat:**
  - Panel kryteriów pojawia się natychmiast po wpisaniu pierwszego znaku.
  - Kryterium *„Min. 10 znaków”* jest oznaczone szarym kółkiem (niespełnione).
  - Przycisk wysłania formularza pozostaje zablokowany (`disabled`).

---

### `TC-AUTH-003`: Odrzucenie próby logowania na konto przed aktywacją adresu e-mail
* **Priorytet:** `P1`
* **Typ testu:** Bezpieczeństwo / Negatywny (State Transition)
* **Status automatyzacji:** 🤖 Do automatyzacji (E2E + API)
* **Warunki wstępne:** Konto `nieaktywny@example.com` zostało zarejestrowane, ale nie kliknięto linku aktywacyjnego.
* **Kroki:**
  1. Otwórz formularz logowania na `/auth`.
  2. Wprowadź e-mail `nieaktywny@example.com` oraz poprawne hasło `MacroGuard2026!`.
  3. Kliknij przycisk **„Zaloguj się”**.
* **Oczekiwany rezultat:**
  - Serwer zwraca błąd HTTP `403 Forbidden` z flagą `requiresEmailConfirmation: true`.
  - W formularzu logowania pojawia się żółty boks ostrzegawczy: *„Wymagana aktywacja konta. Adres nieaktywny@example.com nie został jeszcze zweryfikowany”*.
  - Wyświetla się przycisk *„Wyślij link aktywacyjny ponownie”*.
  - Użytkownik **nie zostaje** zalogowany do aplikacji.

---

### `TC-AUTH-004`: Pomyślna aktywacja konta za pomocą linku z wiadomości e-mail
* **Priorytet:** `P0`
* **Typ testu:** Pozytywny (State Transition)
* **Status automatyzacji:** 🤖 Do automatyzacji (E2E + API)
* **Warunki wstępne:** W skrzynce Mailpit znajduje się wiadomość aktywacyjna dla `jan.nowak@example.com`.
* **Kroki:**
  1. Pobierz link aktywacyjny z wiadomości e-mail (np. `/auth?tab=confirm-email&email=jan.nowak%40example.com&token=...`).
  2. Otwórz pobrany link w przeglądarce.
* **Oczekiwany rezultat:**
  - Aplikacja automatycznie wysyła żądanie `POST /api/auth/confirm-email`.
  - Wyświetla się zielony komunikat powiadomienia Snackbar: *„Adres e-mail został pomyślnie potwierdzony! Możesz się teraz zalogować”*.
  - Widok przełącza się na zakładkę **Logowanie**, z automatycznie uzupełnionym adresem e-mail.

---

### `TC-AUTH-005`: Ochrona przed atakiem Brute Force — blokada konta po 5 nieudanych próbach
* **Priorytet:** `P0`
* **Typ testu:** Bezpieczeństwo (Brute Force Protection)
* **Status automatyzacji:** 🤖 Do automatyzacji (API / E2E)
* **Warunki wstępne:** Istnieje aktywne konto `brute.test@example.com`.
* **Kroki:**
  1. Wykonaj 4 kolejne próby logowania z błędnym hasłem `ZleHaslo123!`.
  2. Zaobserwuj komunikat ostrzegawczy przy 4. próbie.
  3. Wykonaj 5. próbę logowania z błędnym hasłem.
  4. Wykonaj 6. próbę logowania z **poprawnym** hasłem użytkownika.
* **Oczekiwany rezultat:**
  - Przy 4. próbie aplikacja informuje: *„Nieprawidłowy adres e-mail lub hasło. Uwaga: pozostała 1 próba przed blokadą konta na 5 minut”*.
  - Przy 5. i 6. próbie serwer zwraca kod HTTP `423 Locked`.
  - Komunikat błędu: *„Konto zostało tymczasowo zablokowane z powodu 5 nieudanych prób logowania. Spróbuj ponownie za 5 min”*.
  - Nawet podanie prawidłowego hasła przy 6. próbie nie pozwala na zalogowanie w trakcie trwania blokady.

---

### `TC-AUTH-006`: Reset hasła przez e-mail i automatyczne zdjęcie blokady konta
* **Priorytet:** `P1`
* **Typ testu:** Pozytywny / Bezpieczeństwo
* **Status automatyzacji:** 🤖 Do automatyzacji (E2E)
* **Warunki wstępne:** Konto `reset.test@example.com` istnieje w systemie.
* **Kroki:**
  1. W formularzu logowania kliknij *„Nie pamiętasz hasła?”*.
  2. Podaj e-mail `reset.test@example.com` i kliknij *„Wyślij link resetujący”*.
  3. Otwórz link z wiadomości w Mailpit.
  4. Wprowadź nowe hasło `NoweBezpieczne2026!` i potwierdź.
  5. Zaloguj się nowym hasłem.
* **Oczekiwany rezultat:**
  - Hasło zostaje zaktualizowane w bazie.
  - Ewentualna blokada konta i licznik nieudanych prób zostają wyzerowane (`ResetAccessFailedCountAsync`).
  - Użytkownik loguje się pomyślnie nowym hasłem.

---

### `TC-AUTH-007`: Ochrona tras (`AuthGuard`) przed nieautoryzowanym dostępem
* **Priorytet:** `P1`
* **Typ testu:** Bezpieczeństwo
* **Status automatyzacji:** 🤖 Do automatyzacji (E2E)
* **Warunki wstępne:** Przeglądarka w trybie incognito (brak tokena w `localStorage`).
* **Kroki:**
  1. Spróbuj wejść bezpośrednio pod adres URL: `http://localhost:4200/diary`.
  2. Spróbuj wejść bezpośrednio pod adres URL: `http://localhost:4200/calculator`.
  3. Spróbuj wejść bezpośrednio pod adres URL: `http://localhost:4200/stats`.
* **Oczekiwany rezultat:**
  - `AuthGuard` blokuje dostęp do chronionych widoków.
  - Za każdym razem następuje automatyczne przekierowanie do widoku logowania: `/auth`.

---

## 2. Moduł: Profil & Kalkulator BMR / TDEE (CALC)

### `TC-CALC-001`: Prawidłowe wyliczenie BMR i TDEE dla mężczyzny z celem redukcji (-15%)
* **Priorytet:** `P0`
* **Typ testu:** Pozytywny / Matematyczny
* **Status automatyzacji:** 🤖 Do automatyzacji (E2E + Unit/API)
* **Warunki wstępne:** Zalogowany użytkownik wchodzi do zakładki Kalkulator `/calculator`.
* **Kroki:**
  1. Wybierz płeć: **Mężczyzna**.
  2. Wprowadź parametry: Wiek = `25`, Wzrost = `180 cm`, Waga = `80 kg`.
  3. Wybierz aktywność: **Umiarkowana (trening 3-5x w tyg.)** [współczynnik 1.55].
  4. Wybierz cel: **Redukcja tkanki tłuszczowej** z deficytem **-15%**.
  5. Wprowadź wagę docelową: `74 kg`.
  6. Kliknij **„Zapisz i zaktualizuj mój profil”**.
* **Oczekiwany rezultat:**
  - $BMR = (10 \times 80) + (6.25 \times 180) - (5 \times 25) + 5 = 800 + 1125 - 125 + 5 = 1805 \text{ kcal}$.
  - $TDEE = 1805 \times 1.55 \approx 2798 \text{ kcal}$.
  - Kalorie docelowe (deficyt -15%): $2798 \times 0.85 \approx 2378 \text{ kcal}$.
  - Profil zostaje zapisany w bazie danych, a wartości w dzienniku odzwierciedlają cel 2378 kcal.

---

### `TC-CALC-002`: Ostrzeżenie medyczne przy deficycie schodzącym poniżej BMR
* **Priorytet:** `P1`
* **Typ testu:** Negatywny / Walidacja Bezpieczeństwa Zdrowotnego
* **Status automatyzacji:** 🤖 Do automatyzacji (E2E)
* **Warunki wstępne:** Użytkownik w widoku Kalkulatora.
* **Kroki:**
  1. Wprowadź dane: Kobieta, 30 lat, 160 cm, 55 kg, Aktywność niska (1.2).
  2. Wybierz redukcję z agresywnym własnym deficytem: `-35%`.
* **Oczekiwany rezultat:**
  - Wyliczone kalorie docelowe spadają poniżej BMR ($BMR \approx 1240\text{ kcal}$, Cel $< 1200\text{ kcal}$).
  - Aplikacja wyświetla widoczny żółty/czerwony baner ostrzegawczy informujący, że schodzenie poniżej BMR jest niebezpieczne dla zdrowia i spowalnia metabolizm.

---

## 3. Moduł: Dziennik Żywieniowy & Obsługa Posiłków (DIARY)

### `TC-DIARY-001`: Dodanie produktu z bazy do posiłku i aktualizacja sumy makro
* **Priorytet:** `P0`
* **Typ testu:** Pozytywny (Core Flow)
* **Status automatyzacji:** 🤖 Do automatyzacji (E2E)
* **Warunki wstępne:** Zalogowany użytkownik w widoku `/diary` na dniu dzisiejszym. Posiłek *Śniadanie* jest pusty (0 kcal).
* **Kroki:**
  1. Przy karcie *Śniadanie* kliknij przycisk **„+ Dodaj”**.
  2. W oknie modalnym w polu wyszukiwania wpisz `Jajko`.
  3. Wybierz z listy produkt *„Jajko kurze całe (1 szt. ~ 55g) (Wiejskie)”* (143 kcal, B: 12.6g, W: 0.7g, T: 9.5g / 100g).
  4. Wprowadź gramaturę: `150 g`.
  5. Kliknij przycisk **„Dodaj do posiłku”**.
* **Oczekiwany rezultat:**
  - Okno modalne zamyka się, pojawia się powiadomienie Snackbar: *„Dodano Jajko kurze całe do posiłku: Śniadanie”*.
  - W karcie Śniadanie pojawia się pozycja: 150 g, ~215 kcal (214.5 kcal).
  - Suma kalorii śniadania oraz pasek postępu kalorii dnia natychmiast zwiększają się o ~215 kcal.
  - Wartości białka (+18.9g), węglowodanów (+1.0g) i tłuszczów (+14.2g) w podsumowaniu górnym zostają zaktualizowane.

---

### `TC-DIARY-002`: Dodanie napoju z wyborem objętości w mililitrach (ml)
* **Priorytet:** `P1`
* **Typ testu:** Pozytywny
* **Status automatyzacji:** 🤖 Do automatyzacji (E2E)
* **Warunki wstępne:** Użytkownik w widoku Dziennika.
* **Kroki:**
  1. Kliknij *„+ Dodaj”* przy posiłku *Obiad*.
  2. Wybierz kategorię *„Napoje i Płyny”* i wyszukaj `Coca-Cola Original`.
  3. Sprawdź, czy jednostka zmieniła się na `ml / g` oraz czy pojawiły się przyciski szybkiego wyboru: *150ml, 250ml, 330ml, 500ml*.
  4. Kliknij przycisk szybkiego wyboru **„330 ml (puszka)”**.
  5. Zatwierdź dodanie.
* **Oczekiwany rezultat:**
  - Wpis zostaje dodany z wartością 330 ml i przeliczoną wartością: $330 \times 0.42 = 138.6\text{ kcal}$ (w podsumowaniu zaokrąglane do 139 kcal).

---

### `TC-DIARY-003`: Usunięcie pojedynczej pozycji z posiłku
* **Priorytet:** `P1`
* **Typ testu:** Pozytywny
* **Status automatyzacji:** 🤖 Do automatyzacji (E2E)
* **Warunki wstępne:** Posiłek zawiera co najmniej 1 dodaną pozycję.
* **Kroki:**
  1. Najedź na pozycję w posiłku i kliknij ikonę kosza (Usuń).
* **Oczekiwany rezultat:**
  - Pozycja znika z listy wpisów.
  - Kalorie i makroskładniki tej pozycji zostają natychmiast odjęte z podsumowania posiłku oraz sumy całego dnia.
  - Wyświetla się powiadomienie Snackbar: *„Wpis został usunięty”*.

---

### `TC-DIARY-004`: Wyczyszczenie wszystkich pozycji z posiłku („Wyczyść wszystkie pozycje z tego posiłku”) z potwierdzeniem
* **Priorytet:** `P1`
* **Typ testu:** Pozytywny (Nowa Funkcjonalność)
* **Status automatyzacji:** 🤖 Do automatyzacji (E2E)
* **Warunki wstępne:** Posiłek *Obiad* zawiera 3 pozycje (np. Ryż, Kurczak, Oliwa).
* **Kroki:**
  1. W nagłówku posiłku *Obiad* zlokalizuj przycisk z ikoną miotełki (podpowiedź: *„Wyczyść wszystkie pozycje z tego posiłku”*).
  2. Kliknij przycisk **„Wyczyść wszystkie pozycje z tego posiłku”**.
  3. W wyświetlonym oknie dialogowym `window.confirm`:
     *Zweryfikuj treść pytania: „Czy na pewno chcesz usunąć wszystkie pozycje (3 pozycje) z posiłku "Obiad"? Tej operacji nie można cofnąć.”*
  4. Kliknij **OK (Zatwierdź)**.
* **Oczekiwany rezultat:**
  - Wszystkie 3 pozycje zostają usunięte z posiłku w jednym żądaniu `DELETE /api/diary/clear-meal`.
  - Licznik kalorii Obiadu resetuje się do 0 kcal.
  - Pasek postępu kalorii dnia aktualizuje się automatycznie.
  - Wyświetla się komunikat: *„Usunięto wszystkie pozycje (3) z posiłku”*.

---

### `TC-DIARY-005`: Anulowanie wyczyszczenia posiłku (`confirm` -> Anuluj)
* **Priorytet:** `P2`
* **Typ testu:** Negatywny / Bezpieczeństwo Integralności Danych
* **Status automatyzacji:** 🤖 Do automatyzacji (E2E)
* **Warunki wstępne:** Posiłek zawiera 2 pozycje.
* **Kroki:**
  1. Kliknij przycisk **„Wyczyść wszystkie pozycje z tego posiłku”** w nagłówku posiłku.
  2. W oknie dialogowym `confirm` kliknij **Anuluj (Cancel)**.
* **Oczekiwany rezultat:**
  - Żadne żądanie usunięcia nie zostaje wysłane do serwera.
  - Wszystkie pozycje w posiłku pozostają nienaruszone.

---

### `TC-DIARY-006`: Dodanie opcjonalnego posiłku i dynamiczna aktualizacja licznika w menu
* **Priorytet:** `P1`
* **Typ testu:** Pozytywny / Reaktywność UI
* **Status automatyzacji:** 🤖 Do automatyzacji (E2E)
* **Warunki wstępne:** W dzienniku wyświetlane są 4 posiłki bazowe. W menu górnym widnieje etykieta `Dziennik (4 posiłki)`.
* **Kroki:**
  1. Na dole strony kliknij przycisk **„+ Dodaj kolejny posiłek”**.
  2. Z listy wybierz **„II Śniadanie”**.
* **Oczekiwany rezultat:**
  - Na liście posiłków pojawia się nowa karta *II Śniadanie* w prawidłowej kolejności chronologicznej (pomiędzy Śniadaniem a Obiadem).
  - Pusty posiłek *II Śniadanie* posiada przycisk usuwania `X`.
  - Etykieta w górnym pasku nawigacji natychmiast zmienia się na: `Dziennik (5 posiłków)`.

---

### `TC-DIARY-007`: Kopiowanie posiłku z dnia poprzedniego („Kopiuj z wczoraj”)
* **Priorytet:** `P1`
* **Typ testu:** Pozytywny
* **Status automatyzacji:** 🤖 Do automatyzacji (E2E)
* **Warunki wstępne:** W dniu wczorajszym w posiłku *Śniadanie* dodane były 2 produkty. W dniu dzisiejszym *Śniadanie* jest puste.
* **Kroki:**
  1. W karcie *Śniadanie* kliknij ikonę kopiowania **„Skopiuj ten posiłek z wczoraj”**.
* **Oczekiwany rezultat:**
  - Produkty z wczorajszego śniadania zostają skopiowane do dnia dzisiejszego z zachowaniem gramatur.
  - Wyświetla się komunikat: *„Pomyślnie skopiowano pozycje z wczoraj”*.

---

## 4. Moduł: Baza Produktów Spożywczych (FOOD)

### `TC-FOOD-001`: Wyszukiwanie produktów z filtrowaniem po kategoriach
* **Priorytet:** `P1`
* **Typ testu:** Pozytywny
* **Status automatyzacji:** 🤖 Do automatyzacji (E2E + API)
* **Warunki wstępne:** Dostępna baza 75+ produktów domyślnych.
* **Kroki:**
  1. Otwórz modal dodawania produktu.
  2. W filtrze kategorii wybierz *„Tłuszcze i Oleje”*.
  3. Wpisz w pole wyszukiwania: `Oliwa`.
* **Oczekiwany rezultat:**
  - Lista wyników zawęża się wyłącznie do produktów pasujących: np. *Oliwa z oliwek Extra Virgin*.
  - Produkty z innych kategorii (np. pieczywo czy mięso) nie pojawiają się w wynikach.

---

### `TC-FOOD-002`: Utworzenie własnego produktu spożywczego
* **Priorytet:** `P1`
* **Typ testu:** Pozytywny
* **Status automatyzacji:** 🤖 Do automatyzacji (E2E + API)
* **Warunki wstępne:** Zalogowany użytkownik w modalu dodawania produktu.
* **Kroki:**
  1. Przejdź do zakładki *„Stwórz własny produkt”*.
  2. Wypełnij pola:
     - Nazwa: `Baton proteinowy karmelowy`
     - Marka: `Własna`
     - Kategoria: `Odżywki i Przekąski`
     - Kalorie na 100g: `380`
     - Białko: `32.0 g`, Węglowodany: `28.0 g`, Tłuszcz: `12.0 g`.
  3. Kliknij **„Zapisz produkt w mojej bazie”**.
* **Oczekiwany rezultat:**
  - Produkt zostaje zapisany w bazie danych przypisany do danego `UserId`.
  - Produkt pojawia się w wynikach wyszukiwania i może zostać dodany do posiłku.

---

## 5. Moduł: Własne Dania & Generator AI (SETS / AI)

### `TC-SET-001`: Zapisanie skomponowanego posiłku jako szablonu zestawu („Moje Danie”)
* **Priorytet:** `P1`
* **Typ testu:** Pozytywny
* **Status automatyzacji:** 🤖 Do automatyzacji (E2E)
* **Warunki wstępne:** Posiłek *Śniadanie* zawiera 3 składniki (np. Płatki owsiane, Skyr, Banan).
* **Kroki:**
  1. W nagłówku karty Śniadanie kliknij ikonę zakładki **„Zapisz ten posiłek jako stały zestaw (Moje Danie)”**.
  2. W oknie dialogowym `prompt` wpisz nazwę: `Moja Owsianka Mocy`.
  3. Kliknij **OK**.
* **Oczekiwany rezultat:**
  - Aplikacja wysyła żądanie `POST /api/custom-meal-sets/from-meal`.
  - Wyświetla się potwierdzenie: *„Zapisano zestaw Moja Owsianka Mocy!”*.
  - W modalu dodawania produktów w zakładce *„Moje Zestawy”* widnieje nowo utworzony zestaw gotowy do wstawienia 1-kliknięciem.

---

### `TC-AI-001`: Wygenerowanie posiłku przez AI i dodanie do dziennika
* **Priorytet:** `P2`
* **Typ testu:** Pozytywny
* **Status automatyzacji:** 🤖 Do automatyzacji (E2E)
* **Warunki wstępne:** Użytkownik w widoku Dziennika. Posiłek *Kolacja* ma wolne kalorie (np. 500 kcal).
* **Kroki:**
  1. Przy karcie *Kolacja* kliknij przycisk **„AI Pomysł”** (`auto_awesome`).
  2. W oknie generatora zweryfikuj podpowiedź sugerowanych kalorii (np. 500 kcal).
  3. Kliknij **„Generuj pomysł na posiłek”**.
  4. Po wygenerowaniu przepisu kliknij **„Dodaj ten posiłek do mojego dziennika”**.
* **Oczekiwany rezultat:**
  - Generator proponuje przepis z wyliczonymi składnikami i gramaturami sumującymi się do ~500 kcal.
  - Wszystkie składniki przepisu zostają automatycznie dodane do posiłku *Kolacja* w dzienniku.

---

## 6. Moduł: Monitorowanie Wagi & Postępy (WGHT)

### `TC-WGHT-001`: Zapisanie pomiaru wagi i weryfikacja wykresu SVG
* **Priorytet:** `P1`
* **Typ testu:** Pozytywny
* **Status automatyzacji:** 🤖 Do automatyzacji (E2E)
* **Warunki wstępne:** Zalogowany użytkownik wchodzi do widoku `/stats`.
* **Kroki:**
  1. W sekcji szybkiego zapisu wprowadź wagę: `79.2 kg`.
  2. Wpisz notatkę: `Po treningu rano`.
  3. Kliknij **„Zapisz wagę z dzisiaj”**.
* **Oczekiwany rezultat:**
  - Wpis pojawia się na szczycie tabeli historii.
  - Punkt pomiaru z dzisiejszą datą zostaje dodany do interaktywnego wykresu liniowego SVG.
  - Kafelek KPI *„Ostatnia waga”* wskazuje `79.2 kg`.

---

### `TC-WGHT-002`: Aktualizacja wagi w tym samym dniu (Upsert)
* **Priorytet:** `P2`
* **Typ testu:** Pozytywny / Unikalność Bazy
* **Status automatyzacji:** 🤖 Do automatyzacji (API / E2E)
* **Warunki wstępne:** W dniu dzisiejszym zapisano już wagę `79.2 kg`.
* **Kroki:**
  1. Wprowadź skorygowaną wagę `78.9 kg` dla dzisiejszego dnia i zatwierdź.
* **Oczekiwany rezultat:**
  - W bazie nie powstaje zduplikowany wiersz (indeks unikalny `UserId + Date`).
  - Istniejący rekord zostaje zaktualizowany do wartości `78.9 kg`.

---

## 7. Moduł: Raporty Okresowe & AI Coach (REP / COACH)

### `TC-REP-001`: Wygenerowanie raportu okresowego (7 / 30 dni) z agregacją danych i podglądem wydruku / PDF
* **Priorytet:** `P1`
* **Typ testu:** Pozytywny / Analityka & Raportowanie
* **Status automatyzacji:** 🤖 Do automatyzacji (E2E)
* **Warunki wstępne:** Zalogowany użytkownik z wpisami w dzienniku i historii wagi.
* **Kroki:**
  1. W widoku Dziennika (`/diary`) lub Statystyk (`/stats`) kliknij przycisk **„Raport okresowy”** (ikona dokumentu / PDF).
  2. W otwartym oknie modalnym zweryfikuj domyślny zakres **Tygodniowy (7 dni)** oraz kafelki KPI (Średnia kalorii/dzień, Średnie białko, Zmiana wagi).
  3. Przełącz filtr zakresu na **Miesięczny (30 dni)**.
  4. Kliknij przycisk **„Drukuj / Zapisz PDF”**.
* **Oczekiwany rezultat:**
  - Aplikacja dynamicznie pobiera i przelicza agregacje z żądanego okresu (`GET /api/reports/period?days=30`).
  - Tabela dzienna poprawnie zestawia spożyte kalorie, deficyt/nadwyżkę oraz wagę.
  - Kliknięcie przycisku druku wywołuje okno drukowania przeglądarki (`window.print()`).

---

### `TC-COACH-001`: Generowanie analizy postępów i rekomendacji przez MacroGuard AI Coach
* **Priorytet:** `P1`
* **Typ testu:** Pozytywny / Sztuczna Inteligencja & Analityka
* **Status automatyzacji:** 🤖 Do automatyzacji (E2E)
* **Warunki wstępne:** Użytkownik posiada zapisane posiłki w dzienniku oraz pomiar wagi w widoku `/stats`.
* **Kroki:**
  1. Wejdź do widoku **Waga & Postępy** (`/stats`).
  2. Zlokalizuj sekcję **MacroGuard AI Coach** (Inteligentny Asystent).
  3. Wybierz zakres analizy (np. **7 dni**).
  4. Kliknij przycisk **„Zapytaj AI o podsumowanie”** (ikona `auto_awesome`).
* **Oczekiwany rezultat:**
  - Przycisk przechodzi w stan ładowania z animowanym spinnerem (*„Analizowanie...”*).
  - Po chwili pojawia się raport trenera AI zawierający: werdykt ogólny, analizę kalorii, analizę białka, trend wagi oraz konkretne rekomendacje.
  - Wyświetla się powiadomienie Snackbar: *„Wygenerowano analizę AI Coach!”*.

