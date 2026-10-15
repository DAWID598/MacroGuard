import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { DailyDiaryDto, MealGroupDto, MealType } from '../../core/models/api.models';
import { MacroApiService } from '../../core/services/macro-api.service';
import { DiaryStateService } from '../../core/services/diary-state.service';
import { AddFoodDialogComponent } from './add-food-dialog.component';
import { AiRecipeDialogComponent } from './ai-recipe-dialog.component';
import { ReportDialogComponent } from './report-dialog.component';

@Component({
  selector: 'app-diary',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatDividerModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTooltipModule,
    MatMenuModule
  ],
  template: `
    <div class="page-container">
      <!-- NAGŁÓWEK Z WYBOREM DATY -->
      <div class="diary-header">
        <div>
          <h1>Dziennik Żywieniowy</h1>
          <p class="subtitle">
            Monitoruj dzienne spożycie kalorii i makroskładników w posiłkach
            · <a routerLink="/guide" class="guide-link">Nie wiesz jak zacząć? Przewodnik</a>
          </p>
        </div>

        <div class="header-actions">
          <button mat-flat-button class="ai-generator-btn" (click)="openAiGenerator()">
            <mat-icon>auto_awesome</mat-icon>
            Nie masz pomysłu? Wygeneruj posiłek
          </button>

          <a mat-stroked-button routerLink="/stats" class="weight-link-btn" matTooltip="Śledź poranną wagę i średnie tygodniowe">
            <mat-icon>scale</mat-icon>
            Waga & Postępy
          </a>

          <button mat-stroked-button class="report-btn" (click)="openReportDialog()" matTooltip="Wygeneruj raport tygodniowy / miesięczny do PDF lub druku">
            <mat-icon>picture_as_pdf</mat-icon>
            Raport PDF
          </button>

          <div class="date-navigator">
            <button mat-icon-button (click)="shiftDate(-1)" matTooltip="Poprzedni dzień">
              <mat-icon>chevron_left</mat-icon>
            </button>

            <input
              type="date"
              class="date-input"
              [ngModel]="selectedDate()"
              (ngModelChange)="onDateChange($event)"
            />

            <button mat-icon-button (click)="shiftDate(1)" matTooltip="Następny dzień">
              <mat-icon>chevron_right</mat-icon>
            </button>

            <button mat-stroked-button (click)="goToToday()">Dzisiaj</button>
          </div>
        </div>
      </div>

      @if (diary(); as d) {
        <!-- KARTA PODSUMOWANIA MAKROSKŁADNIKÓW -->
        <mat-card class="summary-card" appearance="outlined">
          <div class="summary-grid">
            <!-- KALORIE -->
            <div class="macro-progress-box main-kcal">
              <div class="box-top">
                <span class="label">
                  <mat-icon>local_fire_department</mat-icon>
                  Kalorie
                </span>
                <span class="remaining-pill" [class.over]="remainingKcal() < 0">
                  {{
                    remainingKcal() >= 0
                      ? 'Pozostało: ' + remainingKcal() + ' kcal'
                      : 'Przekroczono o ' + (-remainingKcal()) + ' kcal'
                  }}
                </span>
              </div>
              <div class="numbers">
                <strong>{{ d.consumedCalories | number:'1.0-0' }}</strong>
                <span>/ {{ d.targetCalories }} kcal ({{ pct(d.consumedCalories, d.targetCalories) }}%)</span>
              </div>
              <mat-progress-bar
                mode="determinate"
                [value]="pct(d.consumedCalories, d.targetCalories)"
                color="primary"
              ></mat-progress-bar>
            </div>

            <!-- BIAŁKO -->
            <div class="macro-progress-box protein-box">
              <div class="box-top">
                <span class="label">Białko (B)</span>
                <span class="pct-label">{{ pct(d.consumedProteinGrams, d.targetProteinGrams) }}%</span>
              </div>
              <div class="numbers">
                <strong>{{ d.consumedProteinGrams | number:'1.0-1' }} g</strong>
                <span>/ {{ d.targetProteinGrams }} g</span>
              </div>
              <mat-progress-bar
                mode="determinate"
                [value]="pct(d.consumedProteinGrams, d.targetProteinGrams)"
              ></mat-progress-bar>
            </div>

            <!-- WĘGLOWODANY -->
            <div class="macro-progress-box carbs-box">
              <div class="box-top">
                <span class="label">Węglowodany (W)</span>
                <span class="pct-label">{{ pct(d.consumedCarbsGrams, d.targetCarbsGrams) }}%</span>
              </div>
              <div class="numbers">
                <strong>{{ d.consumedCarbsGrams | number:'1.0-1' }} g</strong>
                <span>/ {{ d.targetCarbsGrams }} g</span>
              </div>
              <mat-progress-bar
                mode="determinate"
                [value]="pct(d.consumedCarbsGrams, d.targetCarbsGrams)"
              ></mat-progress-bar>
            </div>

            <!-- TŁUSZCZE -->
            <div class="macro-progress-box fat-box">
              <div class="box-top">
                <span class="label">Tłuszcze (T)</span>
                <span class="pct-label">{{ pct(d.consumedFatGrams, d.targetFatGrams) }}%</span>
              </div>
              <div class="numbers">
                <strong>{{ d.consumedFatGrams | number:'1.0-1' }} g</strong>
                <span>/ {{ d.targetFatGrams }} g</span>
              </div>
              <mat-progress-bar
                mode="determinate"
                [value]="pct(d.consumedFatGrams, d.targetFatGrams)"
              ></mat-progress-bar>
            </div>
          </div>
        </mat-card>

        <!-- POSIŁKI W CIĄGU DNIA -->
        <div class="meals-grid">
          @for (meal of displayedMeals(); track meal.mealType) {
            <mat-card class="meal-card" appearance="outlined">
              <div class="meal-card-header">
                <div class="meal-title-group">
                  <div class="meal-icon">
                    <mat-icon>{{ getMealIcon(meal.mealType) }}</mat-icon>
                  </div>
                  <div class="meal-text-group">
                    <h3>{{ meal.mealName }}</h3>
                    <div class="meal-sub-macros">
                      <span class="macro-badge kcal">{{ meal.totalCalories | number:'1.0-0' }} kcal</span>
                      <span class="macro-badge protein">B: {{ meal.totalProtein | number:'1.0-1' }}g</span>
                      <span class="macro-badge carbs">W: {{ meal.totalCarbs | number:'1.0-1' }}g</span>
                      <span class="macro-badge fat">T: {{ meal.totalFat | number:'1.0-1' }}g</span>
                    </div>
                  </div>
                </div>

                <div class="meal-actions">
                  @if (isExtraMeal(meal.mealType) && meal.entries.length === 0) {
                    <button
                      mat-icon-button
                      class="icon-action-btn delete-meal-btn"
                      matTooltip="Usuń ten dodatkowy posiłek"
                      (click)="removeExtraMeal(meal.mealType)"
                    >
                      <mat-icon>close</mat-icon>
                    </button>
                  }

                  @if (meal.entries.length > 0) {
                    <button
                      mat-icon-button
                      class="icon-action-btn clear-meal-btn"
                      matTooltip="Wyczyść wszystkie pozycje z tego posiłku"
                      (click)="clearAllEntriesFromMeal(meal)"
                    >
                      <mat-icon>delete_sweep</mat-icon>
                    </button>

                    <button
                      mat-icon-button
                      class="icon-action-btn"
                      matTooltip="Zapisz ten posiłek jako stały zestaw (Moje Danie)"
                      (click)="saveMealAsSet(meal)"
                    >
                      <mat-icon>bookmark_add</mat-icon>
                    </button>
                  }

                  <button
                    mat-icon-button
                    class="icon-action-btn"
                    matTooltip="Skopiuj ten posiłek z wczoraj"
                    (click)="copyMealFromYesterday(meal.mealType)"
                  >
                    <mat-icon>content_copy</mat-icon>
                  </button>

                  <button
                    mat-stroked-button
                    class="ai-meal-btn"
                    matTooltip="Wygeneruj pomysł na ten posiłek z AI"
                    (click)="openAiGenerator(meal.mealType)"
                  >
                    <mat-icon>auto_awesome</mat-icon>
                    AI Pomysł
                  </button>

                  <button
                    mat-flat-button
                    color="primary"
                    class="add-btn"
                    (click)="openAddFoodDialog(meal)"
                  >
                    <mat-icon>add</mat-icon>
                    Dodaj
                  </button>
                </div>
              </div>

              <mat-divider></mat-divider>

              <div class="meal-entries">
                @for (entry of meal.entries; track entry.id) {
                  <div class="entry-row">
                    <div class="entry-main">
                      <div class="entry-name">
                        {{ entry.foodName }}
                        @if (entry.brand) {
                          <span class="entry-brand">({{ entry.brand }})</span>
                        }
                      </div>
                      <div class="entry-details">
                        <span class="grams-pill">{{ entry.weightGrams }} g</span>
                        <span class="macro-badge kcal">{{ entry.calories | number:'1.0-0' }} kcal</span>
                        <span class="macro-badge protein">B: {{ entry.protein }}g</span>
                        <span class="macro-badge carbs">W: {{ entry.carbs }}g</span>
                        <span class="macro-badge fat">T: {{ entry.fat }}g</span>
                      </div>
                    </div>

                    <button
                      mat-icon-button
                      color="warn"
                      matTooltip="Usuń z posiłku"
                      (click)="removeEntry(entry.id)"
                    >
                      <mat-icon>delete_outline</mat-icon>
                    </button>
                  </div>
                } @empty {
                  <div class="empty-meal">
                    <span>Brak dodanych produktów w tym posiłku.</span>
                  </div>
                }
              </div>
            </mat-card>
          }
        </div>

        <!-- PRZYCISK DODAWANIA KOLEJNEGO POSIŁKU -->
        <div class="add-extra-meal-container">
          <button
            mat-stroked-button
            color="primary"
            [matMenuTriggerFor]="addMealMenu"
            class="add-extra-meal-btn"
            [disabled]="availableExtraMeals().length === 0"
          >
            <mat-icon>add_circle_outline</mat-icon>
            Dodaj kolejny posiłek
          </button>
          <mat-menu #addMealMenu="matMenu">
            @for (opt of availableExtraMeals(); track opt.type) {
              <button mat-menu-item (click)="addExtraMeal(opt.type)">
                <mat-icon>{{ opt.icon }}</mat-icon>
                <span>{{ opt.label }}</span>
              </button>
            }
          </mat-menu>
        </div>
      }
    </div>
  `,
  styles: [`
    .diary-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 20px;

      h1 {
        margin: 0 0 4px;
        font-size: 26px;
        font-weight: 700;
        color: #0f172a;
      }

      .subtitle {
        margin: 0;
        color: #64748b;
        font-size: 14px;

        .guide-link {
          color: #4f46e5;
          text-decoration: none;
          font-weight: 600;

          &:hover {
            text-decoration: underline;
          }
        }
      }
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .weight-link-btn {
      background: #ffffff !important;
      color: #2563eb !important;
      border-color: #bfdbfe !important;
      font-weight: 600;
      border-radius: 12px;
      padding: 0 14px;
      height: 42px;

      &:hover {
        background: #eff6ff !important;
      }

      mat-icon {
        margin-right: 6px;
      }
    }

    .report-btn {
      background: #ffffff !important;
      color: #0f172a !important;
      border-color: #cbd5e1 !important;
      font-weight: 600;
      border-radius: 12px;
      padding: 0 14px;
      height: 42px;

      mat-icon {
        color: #ef4444;
        margin-right: 6px;
      }

      &:hover {
        background: #f8fafc !important;
      }
    }


    .icon-action-btn {
      color: #64748b;

      &:hover {
        color: #2563eb;
        background: #eff6ff;
      }
    }

    .ai-generator-btn {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important;
      color: #ffffff !important;
      font-weight: 600;
      border-radius: 12px;
      padding: 0 16px;
      height: 42px;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.25);
      transition: transform 0.15s ease, box-shadow 0.15s ease;

      &:hover {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(79, 70, 229, 0.35);
      }

      mat-icon {
        margin-right: 6px;
      }
    }

    .date-navigator {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #ffffff;
      padding: 6px 12px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;

      .date-input {
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        padding: 6px 10px;
        font-family: inherit;
        font-size: 14px;
        font-weight: 600;
        color: #1e293b;
      }
    }

    .summary-card {
      padding: 20px;
      border-radius: 16px;
      background: #ffffff;
      margin-bottom: 24px;
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.04);
    }

    .summary-grid {
      display: grid;
      grid-template-columns: 1.4fr 1fr 1fr 1fr;
      gap: 18px;
    }

    @media (max-width: 900px) {
      .summary-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    @media (max-width: 560px) {
      .summary-grid {
        grid-template-columns: 1fr;
      }
    }

    .macro-progress-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px 16px;

      .box-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;

        .label {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 13px;
          font-weight: 600;
          color: #475569;

          mat-icon {
            font-size: 18px;
            width: 18px;
            height: 18px;
            color: #4f46e5;
          }
        }

        .pct-label {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
        }

        .remaining-pill {
          font-size: 11.5px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 10px;
          background: #dcfce7;
          color: #166534;

          &.over {
            background: #fee2e2;
            color: #991b1b;
          }
        }
      }

      .numbers {
        margin-bottom: 10px;
        strong {
          font-size: 20px;
          font-weight: 700;
          color: #0f172a;
          margin-right: 4px;
        }
        span {
          font-size: 13px;
          color: #64748b;
        }
      }
    }

    .meals-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
    }

    @media (max-width: 860px) {
      .meals-grid {
        grid-template-columns: 1fr;
      }
    }

    .meal-card {
      border-radius: 16px;
      background: #ffffff;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .meal-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 18px;
      gap: 12px;
      flex-wrap: wrap;

      .meal-title-group {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;

        .meal-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #eef2ff;
          color: #3f51b5;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .meal-text-group {
          min-width: 0;
        }

        h3 {
          margin: 0 0 5px;
          font-size: 16.5px;
          font-weight: 700;
          color: #0f172a;
          line-height: 1.2;
        }

        .meal-sub-macros {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 5px 6px;
          line-height: 1.3;
        }
      }

      .meal-actions {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
      }

      .ai-meal-btn {
        border-color: #c7d2fe !important;
        color: #4f46e5 !important;
        font-weight: 600;
        border-radius: 10px;

        &:hover {
          background: #eef2ff !important;
        }

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
          margin-right: 4px;
        }
      }
    }

    .meal-entries {
      padding: 8px 18px 16px;
      flex: 1;
    }

    .entry-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #f1f5f9;

      &:last-child {
        border-bottom: none;
      }

      .entry-name {
        font-weight: 600;
        font-size: 14px;
        color: #1e293b;
        margin-bottom: 4px;
      }

      .entry-brand {
        font-weight: 400;
        color: #64748b;
        font-size: 12.5px;
      }

      .entry-details {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 5px 6px;
        line-height: 1.3;

        .grams-pill {
          font-size: 11.5px;
          font-weight: 600;
          color: #334155;
          background: #e2e8f0;
          padding: 2.5px 8px;
          border-radius: 8px;
          white-space: nowrap;
        }
      }
    }

    .delete-meal-btn,
    .clear-meal-btn {
      color: #94a3b8;
      &:hover {
        color: #ef4444;
        background: #fee2e2;
      }
    }

    .add-extra-meal-container {
      display: flex;
      justify-content: center;
      margin-top: 16px;
      margin-bottom: 24px;

      .add-extra-meal-btn {
        height: 44px;
        border-radius: 12px;
        font-weight: 600;
        border-style: dashed;
        border-width: 2px;
        padding: 0 24px;
        background: #f8fafc;

        mat-icon {
          margin-right: 6px;
        }

        &:hover:not([disabled]) {
          background: #eef2ff;
        }
      }
    }

    .empty-meal {
      padding: 22px 0 12px;
      text-align: center;
      color: #94a3b8;
      font-size: 13.5px;
    }
  `]
})
export class DiaryComponent implements OnInit {
  private readonly api = inject(MacroApiService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly diaryState = inject(DiaryStateService);

  constructor() {
    effect(() => {
      const count = this.displayedMeals().length;
      if (count > 0) {
        this.diaryState.updateMealsCount(count);
      }
    });
  }

  private readonly PERSISTENT_MEALS_KEY = 'macroguard_persistent_meals';

  readonly allExtraMealDefinitions = [
    { type: MealType.SecondBreakfast, label: 'II Śniadanie', icon: 'brunch_dining' },
    { type: MealType.AfternoonSnack, label: 'Podwieczorek', icon: 'free_breakfast' },
    { type: MealType.PreWorkout, label: 'Posiłek przedtreningowy', icon: 'bolt' },
    { type: MealType.PostWorkout, label: 'Posiłek potreningowy', icon: 'fitness_center' },
    { type: MealType.ExtraMeal, label: 'Dodatkowy posiłek', icon: 'add_task' },
    { type: MealType.Drinks, label: 'Napoje i Płyny', icon: 'local_drink' }
  ];

  readonly persistentExtraMeals = signal<MealType[]>(this.loadPersistentMeals());
  readonly dayExtraMealsByDate = signal<Record<string, MealType[]>>({});
  readonly dayRemovedMealsByDate = signal<Record<string, MealType[]>>({});

  readonly dayExtraMeals = computed<MealType[]>(() => {
    return this.dayExtraMealsByDate()[this.selectedDate()] ?? [];
  });

  readonly selectedDate = signal<string>(this.formatToday());
  readonly diary = signal<DailyDiaryDto | null>(null);

  readonly displayedMeals = computed<MealGroupDto[]>(() => {
    const d = this.diary();
    if (!d) return [];

    const date = this.selectedDate();
    const removedToday = new Set(this.dayRemovedMealsByDate()[date] ?? []);

    const backendMeals = (d.meals ?? []).filter(m => !removedToday.has(m.mealType) || m.entries.length > 0);
    const activeTypes = new Set<MealType>(backendMeals.map(m => m.mealType));

    const extraCandidates = [
      ...this.persistentExtraMeals(),
      ...this.dayExtraMeals()
    ].filter(t => !removedToday.has(t));

    const result: MealGroupDto[] = [...backendMeals];

    for (const extraType of extraCandidates) {
      if (!activeTypes.has(extraType)) {
        activeTypes.add(extraType);
        result.push({
          mealType: extraType,
          mealName: this.getMealLabel(extraType),
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
          entries: []
        });
      }
    }

    return result.sort((a, b) => this.getMealSortOrder(a.mealType) - this.getMealSortOrder(b.mealType));
  });

  readonly availableExtraMeals = computed(() => {
    const currentTypes = new Set(this.displayedMeals().map(m => m.mealType));
    return this.allExtraMealDefinitions.filter(def => !currentTypes.has(def.type));
  });

  readonly remainingKcal = computed(() => {
    const d = this.diary();
    if (!d) return 0;
    return Math.round(d.targetCalories - d.consumedCalories);
  });

  ngOnInit(): void {
    this.loadDiary();
  }

  loadDiary(): void {
    this.api.getDailyDiary(this.selectedDate()).subscribe({
      next: (res) => this.diary.set(res)
    });
  }

  onDateChange(newDate: string): void {
    if (!newDate) return;
    this.selectedDate.set(newDate);
    this.loadDiary();
  }

  shiftDate(days: number): void {
    const current = new Date(this.selectedDate() + 'T12:00:00');
    current.setDate(current.getDate() + days);
    this.selectedDate.set(current.toISOString().slice(0, 10));
    this.loadDiary();
  }

  goToToday(): void {
    this.selectedDate.set(this.formatToday());
    this.loadDiary();
  }

  pct(consumed: number, target: number): number {
    if (!target || target <= 0) return 0;
    return Math.min(100, Math.round((consumed / target) * 100));
  }

  isExtraMeal(type: MealType): boolean {
    return type === MealType.SecondBreakfast ||
           type === MealType.AfternoonSnack ||
           type === MealType.PreWorkout ||
           type === MealType.PostWorkout ||
           type === MealType.ExtraMeal ||
           type === MealType.Drinks;
  }

  getMealSortOrder(type: MealType): number {
    switch (type) {
      case MealType.Breakfast: return 1;
      case MealType.SecondBreakfast: return 2;
      case MealType.Lunch: return 3;
      case MealType.Snack: return 4;
      case MealType.AfternoonSnack: return 5;
      case MealType.Dinner: return 6;
      case MealType.PreWorkout: return 7;
      case MealType.PostWorkout: return 8;
      case MealType.ExtraMeal: return 9;
      case MealType.Drinks: return 10;
      default: return 99;
    }
  }

  getMealLabel(mealType: MealType): string {
    switch (mealType) {
      case MealType.Breakfast: return 'Śniadanie';
      case MealType.SecondBreakfast: return 'II Śniadanie';
      case MealType.Lunch: return 'Obiad';
      case MealType.AfternoonSnack: return 'Podwieczorek';
      case MealType.Dinner: return 'Kolacja';
      case MealType.Snack: return 'Przekąska';
      case MealType.PreWorkout: return 'Posiłek przedtreningowy';
      case MealType.PostWorkout: return 'Posiłek potreningowy';
      case MealType.ExtraMeal: return 'Dodatkowy posiłek';
      case MealType.Drinks: return 'Napoje i Płyny';
      default: return 'Posiłek';
    }
  }

  getMealIcon(mealType: MealType): string {
    switch (mealType) {
      case MealType.Breakfast:
        return 'wb_sunny';
      case MealType.SecondBreakfast:
        return 'brunch_dining';
      case MealType.Lunch:
        return 'restaurant';
      case MealType.AfternoonSnack:
        return 'free_breakfast';
      case MealType.Dinner:
        return 'nights_stay';
      case MealType.Snack:
        return 'cookie';
      case MealType.PreWorkout:
        return 'bolt';
      case MealType.PostWorkout:
        return 'fitness_center';
      case MealType.ExtraMeal:
        return 'add_task';
      case MealType.Drinks:
        return 'local_drink';
      default:
        return 'fastfood';
    }
  }

  addExtraMeal(type: MealType): void {
    const date = this.selectedDate();
    const removed = this.dayRemovedMealsByDate()[date] ?? [];
    if (removed.includes(type)) {
      this.dayRemovedMealsByDate.update(map => ({
        ...map,
        [date]: removed.filter(t => t !== type)
      }));
    }

    const current = this.dayExtraMealsByDate()[date] ?? [];
    if (!current.includes(type)) {
      this.dayExtraMealsByDate.update(map => ({
        ...map,
        [date]: [...current, type]
      }));
    }

    const def = this.allExtraMealDefinitions.find(d => d.type === type);
    const label = def?.label ?? 'Dodatkowy posiłek';

    if (!this.persistentExtraMeals().includes(type)) {
      const ref = this.snackBar.open(
        `Dodano posiłek "${label}". Czy chcesz wyświetlać go codziennie?`,
        'Tak, codziennie',
        { duration: 7000 }
      );
      ref.onAction().subscribe(() => {
        this.togglePersistentMeal(type, true);
      });
    } else {
      this.snackBar.open(`Dodano posiłek "${label}".`, 'OK', { duration: 3000 });
    }
  }

  togglePersistentMeal(type: MealType, enable: boolean): void {
    const current = this.persistentExtraMeals();
    let updated: MealType[];
    if (enable) {
      updated = current.includes(type) ? current : [...current, type];
    } else {
      updated = current.filter(t => t !== type);
    }
    this.persistentExtraMeals.set(updated);
    this.savePersistentMeals(updated);

    const def = this.allExtraMealDefinitions.find(d => d.type === type);
    const label = def?.label ?? 'Posiłek';
    if (enable) {
      this.snackBar.open(`Posiłek "${label}" będzie teraz wyświetlany każdego dnia!`, 'Świetnie', { duration: 4000 });
    }
  }

  removeExtraMeal(type: MealType): void {
    const date = this.selectedDate();
    const removed = this.dayRemovedMealsByDate()[date] ?? [];
    if (!removed.includes(type)) {
      this.dayRemovedMealsByDate.update(map => ({
        ...map,
        [date]: [...removed, type]
      }));
    }

    const current = this.dayExtraMealsByDate()[date] ?? [];
    this.dayExtraMealsByDate.update(map => ({
      ...map,
      [date]: current.filter(t => t !== type)
    }));

    if (this.persistentExtraMeals().includes(type)) {
      this.togglePersistentMeal(type, false);
    }

    const def = this.allExtraMealDefinitions.find(d => d.type === type);
    this.snackBar.open(`Usunięto posiłek "${def?.label ?? ''}".`, 'OK', { duration: 3000 });
  }

  private loadPersistentMeals(): MealType[] {
    try {
      const raw = localStorage.getItem(this.PERSISTENT_MEALS_KEY);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return (parsed as MealType[]).filter(
            t => t !== MealType.Breakfast &&
                 t !== MealType.Lunch &&
                 t !== MealType.Snack &&
                 t !== MealType.Dinner
          );
        }
      }
    } catch {}
    return [];
  }

  private savePersistentMeals(meals: MealType[]): void {
    try {
      localStorage.setItem(this.PERSISTENT_MEALS_KEY, JSON.stringify(meals));
    } catch {}
  }

  openAiGenerator(mealType?: MealType): void {
    const rem = this.remainingKcal();
    const suggested = rem > 150 ? Math.min(rem, 900) : 500;

    const ref = this.dialog.open(AiRecipeDialogComponent, {
      width: '680px',
      maxWidth: '96vw',
      data: {
        date: this.selectedDate(),
        defaultMealType: mealType ?? MealType.Breakfast,
        suggestedCalories: suggested
      }
    });

    ref.afterClosed().subscribe((res) => {
      if (res?.applied) {
        this.snackBar.open(
          `Pomyślnie dodano przepis "${res.title}" (${res.count} składników) do dziennika!`,
          'Super!',
          { duration: 4000 }
        );
        this.loadDiary();
      }
    });
  }

  openAddFoodDialog(meal: MealGroupDto): void {
    const ref = this.dialog.open(AddFoodDialogComponent, {
      width: '640px',
      maxWidth: '96vw',
      data: {
        date: this.selectedDate(),
        mealType: meal.mealType,
        mealName: meal.mealName
      }
    });

    ref.afterClosed().subscribe((added) => {
      if (added) {
        this.snackBar.open(`Dodano "${added.foodName}" do posiłku: ${meal.mealName}`, 'OK', {
          duration: 2500
        });
        this.loadDiary();
      }
    });
  }

  removeEntry(entryId: string): void {
    this.api.deleteMealEntry(entryId).subscribe({
      next: () => {
        this.snackBar.open('Wpis został usunięty.', 'OK', { duration: 2000 });
        this.loadDiary();
      }
    });
  }

  clearAllEntriesFromMeal(meal: MealGroupDto): void {
    const count = meal.entries.length;
    if (count === 0) return;

    const countText = count === 1 ? '1 pozycję' : count < 5 ? `${count} pozycje` : `${count} pozycji`;
    const confirmed = confirm(
      `Czy na pewno chcesz usunąć wszystkie pozycje (${countText}) z posiłku "${meal.mealName}"?\n\nTej operacji nie można cofnąć.`
    );
    if (!confirmed) return;

    this.api.clearMeal(this.selectedDate(), meal.mealType).subscribe({
      next: (res) => {
        this.snackBar.open(res.message || `Wyczyszczono posiłek "${meal.mealName}".`, 'OK', { duration: 3000 });
        this.loadDiary();
      },
      error: () => {
        this.snackBar.open(`Nie udało się wyczyścić posiłku "${meal.mealName}".`, 'Zamknij', { duration: 3000 });
      }
    });
  }

  private getYesterdayString(): string {
    const d = new Date(this.selectedDate() + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    return d.toISOString().slice(0, 10);
  }


  copyMealFromYesterday(mealType: MealType): void {
    const yesterday = this.getYesterdayString();
    this.api.copyMeal({
      sourceDate: yesterday,
      sourceMealType: mealType,
      targetDate: this.selectedDate(),
      targetMealType: mealType
    }).subscribe({
      next: (res) => {
        this.snackBar.open(res.message, 'OK', { duration: 3000 });
        this.loadDiary();
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Brak pozycji w tym posiłku wczoraj.', 'Zamknij', { duration: 3000 });
      }
    });
  }

  saveMealAsSet(meal: MealGroupDto): void {
    const name = prompt(`Wpisz nazwę własnego zestawu dla tego posiłku:`, meal.mealName);
    if (!name || !name.trim()) return;

    this.api.createMealSetFromMeal({
      name: name.trim(),
      description: null,
      sourceDate: this.selectedDate(),
      sourceMealType: meal.mealType
    }).subscribe({
      next: (set) => {
        this.snackBar.open(`Zapisano zestaw "${set.name}"! Znajdziesz go w zakładce "Moje Zestawy" podczas dodawania jedzenia.`, 'OK', { duration: 4000 });
      },
      error: (err) => {
        this.snackBar.open(err.error?.message || 'Błąd podczas zapisywania zestawu.', 'Zamknij', { duration: 3000 });
      }
    });
  }

  openReportDialog(): void {
    this.dialog.open(ReportDialogComponent, {
      width: '880px',
      maxWidth: '96vw',
      maxHeight: '92vh'
    });
  }

  private formatToday(): string {
    return new Date().toISOString().slice(0, 10);
  }
}

