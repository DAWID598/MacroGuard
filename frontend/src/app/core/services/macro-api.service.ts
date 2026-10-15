import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AddMealEntryRequest,
  AiCoachReportDto,
  AiInfoDto,
  ApplyMealSetRequest,
  ApplyRecipeRequest,
  CalculateProfileRequest,
  CopyDayRequest,
  CopyMealRequest,
  CopyResultDto,
  CreateFoodItemRequest,
  CreateMealSetFromMealRequest,
  CustomMealSetDto,
  DailyDiaryDto,
  FoodItemDto,
  GenerateRecipeRequest,
  GeneratedRecipeDto,
  LogWeightRequest,
  MacroCalculationResult,
  MealEntryDto,
  MealType,
  PeriodReportDto,
  UserProfileDto,
  WeightEntryDto,
  WeightStatsSummaryDto
} from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class MacroApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:5000/api';

  // Profil i Kalkulator BMR/TDEE
  getProfile(): Observable<UserProfileDto> {
    return this.http.get<UserProfileDto>(`${this.baseUrl}/profile`);
  }

  calculateAndSaveProfile(request: CalculateProfileRequest): Observable<UserProfileDto> {
    return this.http.put<UserProfileDto>(`${this.baseUrl}/profile/calculate`, request);
  }

  previewCalculation(request: CalculateProfileRequest): Observable<MacroCalculationResult> {
    return this.http.post<MacroCalculationResult>(`${this.baseUrl}/profile/preview`, request);
  }

  // Baza produktów spożywczych
  searchFoods(query?: string, category?: string): Observable<FoodItemDto[]> {
    let params = new HttpParams();
    if (query) {
      params = params.set('query', query);
    }
    if (category && category !== 'Wszystkie') {
      params = params.set('category', category);
    }
    return this.http.get<FoodItemDto[]>(`${this.baseUrl}/foods`, { params });
  }

  createFood(request: CreateFoodItemRequest): Observable<FoodItemDto> {
    return this.http.post<FoodItemDto>(`${this.baseUrl}/foods`, request);
  }

  // Dziennik żywieniowy (4 posiłki)
  getDailyDiary(date: string): Observable<DailyDiaryDto> {
    const params = new HttpParams().set('date', date);
    return this.http.get<DailyDiaryDto>(`${this.baseUrl}/diary`, { params });
  }

  addMealEntry(request: AddMealEntryRequest): Observable<MealEntryDto> {
    return this.http.post<MealEntryDto>(`${this.baseUrl}/diary`, request);
  }

  deleteMealEntry(entryId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/diary/${entryId}`);
  }

  clearMeal(date: string, mealType: MealType): Observable<{ message: string; count: number }> {
    const params = new HttpParams().set('date', date).set('mealType', mealType.toString());
    return this.http.delete<{ message: string; count: number }>(`${this.baseUrl}/diary/clear-meal`, { params });
  }

  // Generator przepisów AI
  generateRecipe(request: GenerateRecipeRequest): Observable<GeneratedRecipeDto> {
    return this.http.post<GeneratedRecipeDto>(`${this.baseUrl}/recipes/generate`, request);
  }

  applyRecipe(request: ApplyRecipeRequest): Observable<MealEntryDto[]> {
    return this.http.post<MealEntryDto[]>(`${this.baseUrl}/recipes/apply`, request);
  }

  getAiInfo(): Observable<AiInfoDto> {
    return this.http.get<AiInfoDto>(`${this.baseUrl}/recipes/ai-info`);
  }

  // Waga i Statystyki Postępów
  logWeight(request: LogWeightRequest): Observable<WeightEntryDto> {
    return this.http.post<WeightEntryDto>(`${this.baseUrl}/weights`, request);
  }

  getWeightStats(): Observable<WeightStatsSummaryDto> {
    return this.http.get<WeightStatsSummaryDto>(`${this.baseUrl}/weights/stats`);
  }

  getWeightHistory(days?: number): Observable<WeightEntryDto[]> {
    let params = new HttpParams();
    if (days !== undefined && days !== null) {
      params = params.set('days', days.toString());
    }
    return this.http.get<WeightEntryDto[]>(`${this.baseUrl}/weights/history`, { params });
  }

  deleteWeightEntry(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/weights/${id}`);
  }

  // Kopiowanie posiłków i dni
  copyMeal(request: CopyMealRequest): Observable<CopyResultDto> {
    return this.http.post<CopyResultDto>(`${this.baseUrl}/diary/copy-meal`, request);
  }

  copyDay(request: CopyDayRequest): Observable<CopyResultDto> {
    return this.http.post<CopyResultDto>(`${this.baseUrl}/diary/copy-day`, request);
  }

  // Własne Zestawy („Moje Dania”)
  getCustomMealSets(): Observable<CustomMealSetDto[]> {
    return this.http.get<CustomMealSetDto[]>(`${this.baseUrl}/custom-meal-sets`);
  }

  createMealSetFromMeal(request: CreateMealSetFromMealRequest): Observable<CustomMealSetDto> {
    return this.http.post<CustomMealSetDto>(`${this.baseUrl}/custom-meal-sets/from-meal`, request);
  }

  applyCustomMealSet(id: string, request: ApplyMealSetRequest): Observable<MealEntryDto[]> {
    return this.http.post<MealEntryDto[]>(`${this.baseUrl}/custom-meal-sets/${id}/apply`, request);
  }

  deleteCustomMealSet(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/custom-meal-sets/${id}`);
  }

  // AI Coach
  getAiCoachReport(days: number = 7): Observable<AiCoachReportDto> {
    return this.http.post<AiCoachReportDto>(`${this.baseUrl}/coach/analyze`, { days });
  }

  // Raport Okresowy (Wydruk / PDF)
  getPeriodReport(days: number = 7): Observable<PeriodReportDto> {
    return this.http.get<PeriodReportDto>(`${this.baseUrl}/reports/period?days=${days}`);
  }
}

