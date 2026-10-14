namespace MacroGuard.Domain.Enums;

public enum Gender
{
    Male = 0,
    Female = 1
}

public enum ActivityLevel
{
    Sedentary = 0,        // 1.2 - Praca siedząca (biurowa / zdalna), brak treningów (< 5 tys. kroków)
    LightlyActive = 1,    // 1.375 - Lekka aktywność (1-3 treningi w tygodniu lub praca w ruchu)
    ModeratelyActive = 2, // 1.55 - Umiarkowana aktywność (3-5 regularnych treningów)
    PhysicalWork = 5,     // 1.6 - Praca fizyczna bez regularnych treningów (magazyn, budowa, kurier, gastronomia)
    VeryActive = 3,       // 1.725 - Duża aktywność (6-7 ciężkich treningów LUB praca fizyczna + treningi)
    ExtraActive = 4       // 1.9 - Bardzo duża aktywność (ciężka praca fizyczna + intensywny sport / zawodowiec)
}

public enum DietGoal
{
    Cut = 0,      // Redukcja tkanki tłuszczowej (-15% TDEE)
    Maintain = 1, // Utrzymanie masy ciała (100% TDEE)
    Bulk = 2      // Budowa masy mięśniowej (+12% TDEE)
}

public enum MealType
{
    Breakfast = 0,       // Śniadanie
    Lunch = 1,           // Obiad
    Snack = 2,           // Przekąska
    Dinner = 3,          // Kolacja
    SecondBreakfast = 4, // II Śniadanie
    AfternoonSnack = 5,  // Podwieczorek
    PreWorkout = 6,      // Posiłek przedtreningowy
    PostWorkout = 7,     // Posiłek potreningowy
    ExtraMeal = 8,       // Dodatkowy posiłek
    Drinks = 9           // Napoje i Płyny
}


