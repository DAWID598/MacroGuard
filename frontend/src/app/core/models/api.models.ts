export enum Gender {
  Male = 0,
  Female = 1
}

export enum ActivityLevel {
  Sedentary = 0,
  LightlyActive = 1,
  ModeratelyActive = 2,
  VeryActive = 3,
  ExtraActive = 4
}

export enum DietGoal {
  Cut = 0,
  Maintain = 1,
  Bulk = 2
}

export enum MealType {
  Breakfast = 0, // Śniadanie
  Lunch = 1,     // Obiad
  Snack = 2,     // Przekąska
  Dinner = 3     // Kolacja
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
}

export interface CalculateProfileRequest {
  age: number;
  gender: Gender;
  weightKg: number;
  heightCm: number;
  activityLevel: ActivityLevel;
  goal: DietGoal;
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


