import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  AddMealEntryRequest,
  CalculateProfileRequest,
  CreateFoodItemRequest,
  DailyDiaryDto,
  FoodItemDto,
  MacroCalculationResult,
  MealEntryDto,
  UserProfileDto
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
}

