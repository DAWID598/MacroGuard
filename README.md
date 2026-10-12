# MacroGuard 🥗💪

Aplikacja webowa do liczenia kalorii, makroskładników (Białko / Tłuszcze / Węglowodany), wyliczania zapotrzebowania kalorycznego (**BMR / TDEE** wg wzoru Mifflin-St Jeor) oraz prowadzenia dziennika żywieniowego z podziałem na **4 posiłki** (*Śniadanie, Obiad, Przekąska, Kolacja*).

## Stos Technologiczny

- **Frontend:** Angular 19 (Standalone Components, Signals, Reactive Forms) + **Angular Material**
- **Backend:** .NET 10 Web API (**Clean Architecture**: `Domain`, `Application`, `Infrastructure`, `Api`), Entity Framework Core, ASP.NET Core Identity + JWT Bearer
- **Baza danych:** PostgreSQL 17 (Docker Compose)

---

## Szybki Start

### 1. Uruchom bazę danych PostgreSQL (Docker)
Upewnij się, że aplikacja **Docker Desktop** jest włączona, a następnie w głównym katalogu uruchom:
```powershell
docker compose up -d
```

### 2. Uruchom Backend (.NET 10 API)
Przy pierwszym uruchomieniu API automatycznie utworzy tabele w bazie PostgreSQL i wypełni bazę ~24 popularnymi produktami spożywczymi:
```powershell
dotnet run --project backend/src/MacroGuard.Api
```
Backend nasłuchuje pod adresem: `http://localhost:5000`

### 3. Uruchom Frontend (Angular + Angular Material)
```powershell
npm.cmd --prefix frontend start
```
Aplikacja będzie dostępna w przeglądarce pod adresem: `http://localhost:4200`

