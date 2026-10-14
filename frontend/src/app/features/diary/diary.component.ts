import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
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
import { DailyDiaryDto, MealGroupDto, MealType } from '../../core/models/api.models';
import { MacroApiService } from '../../core/services/macro-api.service';
import { AddFoodDialogComponent } from './add-food-dialog.component';
import { AiRecipeDialogComponent } from './ai-recipe-dialog.component';

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
    MatTooltipModule
  ],
  template: `
    <div class="page-container">
      <!-- NAGŁÓWEK Z WYBOREM DATY -->
      <div class="diary-header">
        <div>
          <h1>Dziennik Żywieniowy</h1>
          <p class="subtitle">
            Monitoruj dzienne spożycie kalorii i makroskładników w 4 posiłkach
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

        <!-- 4 POSIŁKI: ŚNIADANIE, OBIAD, PRZEKĄSKA, KOLACJA -->
        <div class="meals-grid">
          @for (meal of d.meals; track meal.mealType) {
            <mat-card class="meal-card" appearance="outlined">
              <div class="meal-card-header">
                <div class="meal-title-group">
                  <div class="meal-icon">
                    <mat-icon>{{ getMealIcon(meal.mealType) }}</mat-icon>
                  </div>
                  <div>
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
      padding: 16px 18px;
      gap: 12px;

      .meal-title-group {
        display: flex;
        align-items: center;
        gap: 12px;

        .meal-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #eef2ff;
          color: #3f51b5;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        h3 {
          margin: 0 0 4px;
          font-size: 17px;
          font-weight: 700;
          color: #0f172a;
        }
      }

      .meal-actions {
        display: flex;
        align-items: center;
        gap: 8px;
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
        gap: 4px;

        .grams-pill {
          font-size: 12px;
          font-weight: 600;
          color: #334155;
          background: #e2e8f0;
          padding: 2px 8px;
          border-radius: 10px;
          margin-right: 4px;
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

  readonly selectedDate = signal<string>(this.formatToday());
  readonly diary = signal<DailyDiaryDto | null>(null);

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

  getMealIcon(mealType: MealType): string {
    switch (mealType) {
      case MealType.Breakfast:
        return 'wb_sunny';
      case MealType.Lunch:
        return 'restaurant';
      case MealType.Snack:
        return 'cookie';
      case MealType.Dinner:
        return 'nights_stay';
      default:
        return 'fastfood';
    }
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

  private formatToday(): string {
    return new Date().toISOString().slice(0, 10);
  }
}

