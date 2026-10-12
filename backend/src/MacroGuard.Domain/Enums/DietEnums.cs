namespace MacroGuard.Domain.Enums;

public enum Gender
{
    Male = 0,
    Female = 1
}

public enum ActivityLevel
{
    Sedentary = 0,        // 1.2 - Praca siedząca, brak dodatkowej aktywności
    LightlyActive = 1,    // 1.375 - Lekka aktywność (1-3 treningi w tygodniu)
    ModeratelyActive = 2, // 1.55 - Umiarkowana aktywność (3-5 treningów w tygodniu)
    VeryActive = 3,       // 1.725 - Duża aktywność (6-7 treningów w tygodniu)
    ExtraActive = 4       // 1.9 - Bardzo duża aktywność + praca fizyczna
}

public enum DietGoal
{
    Cut = 0,      // Redukcja tkanki tłuszczowej (-15% TDEE)
    Maintain = 1, // Utrzymanie masy ciała (100% TDEE)
    Bulk = 2      // Budowa masy mięśniowej (+12% TDEE)
}

public enum MealType
{
    Breakfast = 0, // Śniadanie
    Lunch = 1,     // Obiad
    Snack = 2,     // Przekąska
    Dinner = 3     // Kolacja
}

