export enum Gender {
  Male = 0,
  Female = 1
}

export enum ActivityLevel {
  Sedentary = 0,
  LightlyActive = 1,
  ModeratelyActive = 2,
  PhysicalWork = 5,
  VeryActive = 3,
  ExtraActive = 4
}

export enum DietGoal {
  Cut = 0,
  Maintain = 1,
  Bulk = 2
}

export enum MealType {
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


export interface AuthResponse {
  token: string;
  userId: string;
  email: string;
  displayName: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordRequest {
  email: string;
  token: string;
  newPassword: string;
}

export interface UserProfileDto {
  id: string;
  age: number;
  gender: Gender;
  weightKg: number;
  heightCm: number;
  activityLevel: ActivityLevel;
  goal: DietGoal;
  bmrCalories: number;
  tdeeCalories: number;
  targetCalories: number;
  targetProteinGrams: number;
  targetCarbsGrams: number;
  targetFatGrams: number;
  targetWeightKg?: number | null;
  deficitPercentage?: number | null;
  weeklyChangeKg?: number | null;
  weightDifferenceKg?: number | null;
  deficitCalories?: number | null;
  estimatedWeeks?: number | null;
  isBelowBmr?: boolean;
}

export interface CalculateProfileRequest {
  age: number;
  gender: Gender;
  weightKg: number;
  heightCm: number;
  activityLevel: ActivityLevel;
  goal: DietGoal;
  targetWeightKg?: number | null;
  deficitPercentage?: number | null;
  weeklyChangeKg?: number | null;
  customCalories?: number | null;
  customProteinGrams?: number | null;
  customCarbsGrams?: number | null;
  customFatGrams?: number | null;
}

export interface MacroCalculationResult {
  bmrCalories: number;
  tdeeCalories: number;
  targetCalories: number;
  targetProteinGrams: number;
  targetCarbsGrams: number;
  targetFatGrams: number;
  targetWeightKg?: number | null;
  weightDifferenceKg?: number | null;
  weeklyChangeKg?: number | null;
  deficitCalories?: number | null;
  estimatedWeeks?: number | null;
  isBelowBmr?: boolean;
}

export interface FoodItemDto {
  id: string;
  name: string;
  brand?: string | null;
  category: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  isCustom: boolean;
}

export interface CreateFoodItemRequest {
  name: string;
  brand?: string | null;
  category: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
}

export interface MealEntryDto {
  id: string;
  foodItemId: string;
  foodName: string;
  brand?: string | null;
  mealType: MealType;
  weightGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface MealGroupDto {
  mealType: MealType;
  mealName: string;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  entries: MealEntryDto[];
}

export interface DailyDiaryDto {
  date: string;
  targetCalories: number;
  targetProteinGrams: number;
  targetCarbsGrams: number;
  targetFatGrams: number;
  consumedCalories: number;
  consumedProteinGrams: number;
  consumedCarbsGrams: number;
  consumedFatGrams: number;
  meals: MealGroupDto[];
}

export interface AddMealEntryRequest {
  foodItemId: string;
  consumedDate: string;
  mealType: MealType;
  weightGrams: number;
}

export interface GenerateRecipeRequest {
  mealType: MealType;
  targetCalories: number;
  preference?: string | null;
}

export interface RecipeIngredientDto {
  name: string;
  weightGrams: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  portionCalories: number;
  portionProtein: number;
  portionCarbs: number;
  portionFat: number;
  category: string;
}

export interface GeneratedRecipeDto {
  title: string;
  description: string;
  prepTimeMinutes: number;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  ingredients: RecipeIngredientDto[];
  steps: string[];
  aiModelUsed?: string;
}

export interface AiInfoDto {
  provider: string;
  modelName: string;
  isLiveAi: boolean;
  displayName: string;
}

export interface ApplyRecipeRequest {
  consumedDate: string;
  mealType: MealType;
  recipeTitle: string;
  ingredients: RecipeIngredientDto[];
}

export interface LogWeightRequest {
  date: string;
  weightKg: number;
  note?: string | null;
}

export interface WeightEntryDto {
  id: string;
  date: string;
  weightKg: number;
  note?: string | null;
  createdAtUtc: string;
}

export interface WeeklyWeightStatDto {
  year: number;
  weekNumber: number;
  startDate: string;
  endDate: string;
  averageWeightKg: number;
  changeFromPreviousWeekKg?: number | null;
  entriesCount: number;
}

export interface WeightStatsSummaryDto {
  currentWeightKg?: number | null;
  lastRecordedDate?: string | null;
  startingWeightKg?: number | null;
  startingDate?: string | null;
  totalChangeKg?: number | null;
  averageThisWeekKg?: number | null;
  averageLastWeekKg?: number | null;
  weeklyChangeKg?: number | null;
  weeklyStats: WeeklyWeightStatDto[];
  recentEntries: WeightEntryDto[];
}

// Kopiowanie posiłków i dni
export interface CopyMealRequest {
  sourceDate: string;
  sourceMealType: MealType;
  targetDate: string;
  targetMealType: MealType;
}

export interface CopyDayRequest {
  sourceDate: string;
  targetDate: string;
}

export interface CopyResultDto {
  copiedEntriesCount: number;
  message: string;
}

// Własne zestawy („Moje Dania”)
export interface CustomMealSetItemDto {
  id: string;
  foodItemId: string;
  foodName: string;
  brand?: string | null;
  weightGrams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface CustomMealSetDto {
  id: string;
  name: string;
  description?: string | null;
  defaultMealType?: MealType | null;
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  itemsCount: number;
  items: CustomMealSetItemDto[];
}

export interface CreateMealSetFromMealRequest {
  name: string;
  description?: string | null;
  sourceDate: string;
  sourceMealType: MealType;
}

export interface ApplyMealSetRequest {
  targetDate: string;
  targetMealType: MealType;
}

// AI Coach
export interface AiCoachRequest {
  days: number;
}

export interface AiCoachReportDto {
  headline: string;
  summary: string;
  calorieAnalysis: string;
  macroAnalysis: string;
  weightTrendAnalysis: string;
  recommendations: string[];
  avgCalories: number;
  targetCalories: number;
  avgProteinGrams: number;
  targetProteinGrams: number;
  weightChangeKg?: number | null;
  loggedDaysCount: number;
  totalDaysInPeriod: number;
  aiModelUsed: string;
  generatedAtUtc: string;
}

// Eksport Raportów
export interface DailyReportItemDto {
  date: string;
  consumedCalories: number;
  consumedProtein: number;
  consumedCarbs: number;
  consumedFat: number;
  weightKg?: number | null;
}

export interface PeriodReportDto {
  userDisplayName: string;
  goal: DietGoal;
  targetCalories: number;
  targetProteinGrams: number;
  targetCarbsGrams: number;
  targetFatGrams: number;
  startDate: string;
  endDate: string;
  totalDays: number;
  loggedDays: number;
  avgCalories: number;
  avgProtein: number;
  avgCarbs: number;
  avgFat: number;
  calorieAdherencePercent: number;
  startWeightKg?: number | null;
  endWeightKg?: number | null;
  weightChangeKg?: number | null;
  dailyRecords: DailyReportItemDto[];
  generatedAtUtc: string;
}



