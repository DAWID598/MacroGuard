import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  AiInfoDto,
  GeneratedRecipeDto,
  MealType
} from '../../core/models/api.models';
import { MacroApiService } from '../../core/services/macro-api.service';

export interface AiRecipeDialogData {
  date: string;
  defaultMealType?: MealType;
  suggestedCalories?: number;
}

@Component({
  selector: 'app-ai-recipe-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatChipsModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="dialog-header">
      <div class="header-badges">
        <div class="ai-badge">
          <mat-icon>auto_awesome</mat-icon>
          <span>AI Kulinarny Asystent</span>
        </div>
        @if (aiInfo(); as info) {
          <div class="model-badge" [class.live]="info.isLiveAi">
            <mat-icon>{{ info.isLiveAi ? 'smart_toy' : 'memory' }}</mat-icon>
            <span>Model: <strong>{{ info.displayName }}</strong></span>
          </div>
        }
      </div>
      <h2>Generator Posiłków</h2>
      <p class="subtitle">Wybierz posiłek i kalorie — sztuczna inteligencja przygotuje dopasowany przepis.</p>
    </div>

    <mat-dialog-content class="dialog-content">
      @if (isLoading()) {
        <!-- STAN ŁADOWANIA AI -->
        <div class="loading-state">
          <mat-spinner diameter="54"></mat-spinner>
          <h3>{{ aiInfo()?.displayName || 'AI' }} komponuje idealny przepis...</h3>
          <p>Dobieram składniki, przeliczam gramatury i optymalizuję rozkład kalorii oraz makroskładników.</p>
        </div>
      } @else {
        @if (recipe(); as r) {
          <!-- WYGENEROWANY PRZEPIS -->
          <div class="recipe-result">
            <div class="recipe-top">
              <div>
                <div class="tags-row">
                  <span class="meal-tag">{{ getMealLabel(selectedMealType) }}</span>
                  <span class="ai-source-tag">
                    <mat-icon>{{ (r.aiModelUsed || '').includes('Wbudowany') ? 'memory' : 'auto_awesome' }}</mat-icon>
                    {{ r.aiModelUsed || aiInfo()?.displayName }}
                  </span>
                </div>
                <h3 class="recipe-title">{{ r.title }}</h3>
                <p class="recipe-desc">{{ r.description }}</p>
              </div>
              <div class="prep-badge">
                <mat-icon>schedule</mat-icon>
                <span>{{ r.prepTimeMinutes }} min</span>
              </div>
            </div>

            <!-- PODSUMOWANIE MAKRO -->
            <div class="macro-banner">
              <div class="m-stat kcal">
                <span class="stat-name">Kalorie</span>
                <strong>{{ r.totalCalories }} kcal</strong>
              </div>
              <div class="m-stat protein">
                <span class="stat-name">Białko</span>
                <strong>{{ r.totalProtein }} g</strong>
              </div>
              <div class="m-stat carbs">
                <span class="stat-name">Węglowodany</span>
                <strong>{{ r.totalCarbs }} g</strong>
              </div>
              <div class="m-stat fat">
                <span class="stat-name">Tłuszcze</span>
                <strong>{{ r.totalFat }} g</strong>
              </div>
            </div>

            <!-- SKŁADNIKI -->
            <div class="section-box">
              <h4>
                <mat-icon color="primary">shopping_basket</mat-icon>
                Składniki z gramaturami ({{ r.ingredients.length }}):
              </h4>
              <div class="ingredients-list">
                @for (ing of r.ingredients; track ing.name) {
                  <div class="ing-item">
                    <div class="ing-main">
                      <span class="ing-name">{{ ing.name }}</span>
                      <span class="ing-grams">{{ ing.weightGrams }} g</span>
                    </div>
                    <div class="ing-macros">
                      <span class="macro-badge kcal">{{ ing.portionCalories }} kcal</span>
                      <span class="macro-badge protein">B: {{ ing.portionProtein }}g</span>
                      <span class="macro-badge carbs">W: {{ ing.portionCarbs }}g</span>
                      <span class="macro-badge fat">T: {{ ing.portionFat }}g</span>
                    </div>
                  </div>
                }
              </div>
            </div>

            <!-- KROKI PRZYGOTOWANIA -->
            <div class="section-box">
              <h4>
                <mat-icon color="primary">menu_book</mat-icon>
                Przygotowanie krok po kroku:
              </h4>
              <ol class="steps-list">
                @for (step of r.steps; track $index) {
                  <li>{{ step }}</li>
                }
              </ol>
            </div>
          </div>
        } @else {
          <!-- FORMULARZ PARAMETRÓW -->
          <form [formGroup]="genForm" (ngSubmit)="onGenerate()" class="gen-form">
            <div class="form-row-2">
              <mat-form-field appearance="outline">
                <mat-label>Posiłek</mat-label>
                <mat-select formControlName="mealType">
                  <mat-option [value]="MealType.Breakfast">Śniadanie</mat-option>
                  <mat-option [value]="MealType.SecondBreakfast">II Śniadanie</mat-option>
                  <mat-option [value]="MealType.Lunch">Obiad</mat-option>
                  <mat-option [value]="MealType.AfternoonSnack">Podwieczorek</mat-option>
                  <mat-option [value]="MealType.Dinner">Kolacja</mat-option>
                  <mat-option [value]="MealType.Snack">Przekąska</mat-option>
                  <mat-option [value]="MealType.PreWorkout">Posiłek przedtreningowy</mat-option>
                  <mat-option [value]="MealType.PostWorkout">Posiłek potreningowy</mat-option>
                  <mat-option [value]="MealType.ExtraMeal">Dodatkowy posiłek</mat-option>
                  <mat-option [value]="MealType.Drinks">Napoje i Koktajle</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Docelowe kalorie (kcal)</mat-label>
                <input matInput type="number" formControlName="targetCalories" min="150" max="2500" />
                <mat-icon matSuffix>local_fire_department</mat-icon>
              </mat-form-field>
            </div>

            <!-- SZYBKIE PREFERENCJE -->
            <div class="pref-chips-wrapper">
              <span class="chips-title">Szybkie preferencje stylu dania:</span>
              <div class="chips-row">
                @for (pref of quickPreferences; track pref) {
                  <button
                    type="button"
                    class="pref-chip"
                    [class.active]="selectedPreference() === pref"
                    (click)="togglePreference(pref)"
                  >
                    {{ pref }}
                  </button>
                }
              </div>
            </div>

            <mat-form-field appearance="outline" class="w-100">
              <mat-label>Dodatkowe życzenia lub składniki z lodówki (opcjonalnie)</mat-label>
              <input
                matInput
                formControlName="customWish"
                placeholder="np. mam kurczaka i awokado, bez cebuli, danie na słodko"
              />
              <mat-icon matSuffix>kitchen</mat-icon>
            </mat-form-field>
          </form>
        }
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end" class="dialog-actions">
      @if (recipe()) {
        <button mat-button (click)="recipe.set(null)" [disabled]="isApplying()">
          <mat-icon>tune</mat-icon>
          Zmień parametry
        </button>
        <button mat-stroked-button color="primary" (click)="onGenerate()" [disabled]="isApplying()">
          <mat-icon>refresh</mat-icon>
          Inny pomysł
        </button>
        <button
          mat-flat-button
          color="primary"
          (click)="onApplyToDiary()"
          [disabled]="isApplying()"
          class="apply-btn"
        >
          @if (isApplying()) {
            <mat-spinner diameter="18"></mat-spinner>
          } @else {
            <span class="btn-content">
              <mat-icon>add_task</mat-icon>
              Dodaj ten posiłek do dziennika
            </span>
          }
        </button>
      } @else {
        <button mat-button mat-dialog-close>Anuluj</button>
        <button
          mat-flat-button
          color="primary"
          (click)="onGenerate()"
          [disabled]="genForm.invalid || isLoading()"
          class="generate-btn"
        >
          <mat-icon>auto_awesome</mat-icon>
          Wygeneruj przepis
        </button>
      }
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      padding: 20px 24px 10px;
      background: linear-gradient(135deg, #f0f4ff, #faf5ff);
      border-bottom: 1px solid #e2e8f0;

      .header-badges {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 8px;
      }

      .model-badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        background: #f1f5f9;
        color: #475569;
        font-size: 11.5px;
        padding: 3px 10px;
        border-radius: 12px;
        border: 1px solid #cbd5e1;
        font-weight: 500;

        mat-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
          color: #64748b;
        }

        strong {
          color: #0f172a;
          font-weight: 700;
        }

        &.live {
          background: #ecfdf5;
          color: #065f46;
          border-color: #a7f3d0;

          mat-icon {
            color: #059669;
          }

          strong {
            color: #047857;
          }
        }
      }

      .ai-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        background: #4f46e5;
        color: #ffffff;
        font-size: 11.5px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding: 3px 10px;
        border-radius: 12px;

        mat-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
        }
      }

      h2 {
        margin: 0 0 4px;
        font-size: 22px;
        font-weight: 700;
        color: #0f172a;
      }

      .subtitle {
        margin: 0;
        color: #64748b;
        font-size: 13.5px;
      }
    }

    .dialog-content {
      padding: 20px 24px;
      min-width: 580px;
      max-height: 70vh;
      overflow-y: auto;
    }

    @media (max-width: 640px) {
      .dialog-content {
        min-width: unset;
      }
    }

    .gen-form {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .form-row-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .w-100 {
      width: 100%;
    }

    .pref-chips-wrapper {
      margin-bottom: 8px;

      .chips-title {
        display: block;
        font-size: 13px;
        font-weight: 600;
        color: #334155;
        margin-bottom: 8px;
      }

      .chips-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .pref-chip {
        border: 1px solid #cbd5e1;
        background: #ffffff;
        color: #334155;
        padding: 6px 12px;
        border-radius: 16px;
        font-size: 12.5px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s ease;

        &:hover {
          border-color: #4f46e5;
        }

        &.active {
          background: #4f46e5;
          color: #ffffff;
          border-color: #4f46e5;
        }
      }
    }

    .loading-state {
      padding: 40px 20px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;

      h3 {
        margin: 8px 0 0;
        font-size: 18px;
        font-weight: 700;
        color: #1e293b;
      }

      p {
        margin: 0;
        color: #64748b;
        font-size: 13.5px;
        max-width: 400px;
      }
    }

    .recipe-result {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .recipe-top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 16px;

      .tags-row {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
      }

      .meal-tag {
        font-size: 11px;
        font-weight: 700;
        text-transform: uppercase;
        color: #4f46e5;
        background: #eef2ff;
        padding: 2px 8px;
        border-radius: 8px;
      }

      .ai-source-tag {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
        font-weight: 700;
        color: #4338ca;
        background: #e0e7ff;
        padding: 2px 8px;
        border-radius: 8px;

        mat-icon {
          font-size: 13px;
          width: 13px;
          height: 13px;
        }
      }

      .recipe-title {
        margin: 6px 0 4px;
        font-size: 20px;
        font-weight: 700;
        color: #0f172a;
      }

      .recipe-desc {
        margin: 0;
        font-size: 13.5px;
        color: #64748b;
        line-height: 1.45;
      }

      .prep-badge {
        display: flex;
        align-items: center;
        gap: 4px;
        background: #f1f5f9;
        color: #334155;
        font-size: 13px;
        font-weight: 600;
        padding: 6px 10px;
        border-radius: 10px;
        white-space: nowrap;

        mat-icon {
          font-size: 18px;
          width: 18px;
          height: 18px;
        }
      }
    }

    .macro-banner {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px;
      text-align: center;

      .m-stat {
        display: flex;
        flex-direction: column;
        gap: 2px;

        .stat-name {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
        }

        strong {
          font-size: 16px;
          font-weight: 700;
        }

        &.kcal {
          color: #3730a3;
        }
        &.protein {
          color: #166534;
        }
        &.carbs {
          color: #92400e;
        }
        &.fat {
          color: #9d174d;
        }
      }
    }

    .section-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px;

      h4 {
        display: flex;
        align-items: center;
        gap: 6px;
        margin: 0 0 10px;
        font-size: 14.5px;
        font-weight: 700;
        color: #1e293b;

        mat-icon {
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }
    }

    .ingredients-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .ing-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 6px;
      padding: 6px 0;
      border-bottom: 1px solid #f1f5f9;

      &:last-child {
        border-bottom: none;
      }

      .ing-main {
        display: flex;
        align-items: center;
        gap: 8px;

        .ing-name {
          font-size: 13.5px;
          font-weight: 600;
          color: #1e293b;
        }

        .ing-grams {
          font-size: 12.5px;
          font-weight: 700;
          background: #e2e8f0;
          padding: 1px 6px;
          border-radius: 6px;
          color: #334155;
        }
      }

      .ing-macros {
        display: flex;
        gap: 4px;
      }
    }

    .steps-list {
      margin: 0;
      padding-left: 20px;
      display: flex;
      flex-direction: column;
      gap: 6px;

      li {
        font-size: 13.5px;
        color: #334155;
        line-height: 1.45;
      }
    }

    .dialog-actions {
      padding: 12px 24px;
      border-top: 1px solid #e2e8f0;
    }

    .generate-btn, .apply-btn {
      border-radius: 10px;
      font-weight: 600;
    }

    .btn-content {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
  `]
})
export class AiRecipeDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(MacroApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<AiRecipeDialogComponent>);

  readonly MealType = MealType;

  readonly isLoading = signal(false);
  readonly isApplying = signal(false);
  readonly recipe = signal<GeneratedRecipeDto | null>(null);
  readonly aiInfo = signal<AiInfoDto | null>(null);
  readonly selectedPreference = signal<string>('Wysokobiałkowy');

  readonly quickPreferences = [
    'Wysokobiałkowy',
    'Szybki (< 15 min)',
    'Na słodko',
    'Na wytrawnie',
    'Wegetariański',
    'Keto / Niskowęglowodanowy'
  ];

  selectedMealType: MealType = MealType.Lunch;

  readonly genForm = this.fb.nonNullable.group({
    mealType: [MealType.Lunch, [Validators.required]],
    targetCalories: [500, [Validators.required, Validators.min(100), Validators.max(2500)]],
    customWish: ['']
  });

  constructor(@Inject(MAT_DIALOG_DATA) public data: AiRecipeDialogData) {}

  ngOnInit(): void {
    this.api.getAiInfo().subscribe({
      next: (info) => this.aiInfo.set(info)
    });

    if (this.data.defaultMealType !== undefined) {
      this.genForm.patchValue({ mealType: this.data.defaultMealType });
      this.selectedMealType = this.data.defaultMealType;
    }
    if (this.data.suggestedCalories && this.data.suggestedCalories > 150) {
      this.genForm.patchValue({ targetCalories: this.data.suggestedCalories });
    }
  }

  togglePreference(pref: string): void {
    if (this.selectedPreference() === pref) {
      this.selectedPreference.set('');
    } else {
      this.selectedPreference.set(pref);
    }
  }

  getMealLabel(type: MealType): string {
    switch (type) {
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

  onGenerate(): void {
    if (this.genForm.invalid) return;
    this.isLoading.set(true);

    const val = this.genForm.getRawValue();
    this.selectedMealType = val.mealType;

    const prefParts: string[] = [];
    if (this.selectedPreference()) {
      prefParts.push(this.selectedPreference());
    }
    if (val.customWish.trim()) {
      prefParts.push(val.customWish.trim());
    }

    const request = {
      mealType: val.mealType,
      targetCalories: val.targetCalories,
      preference: prefParts.join(', ') || null
    };

    this.api.generateRecipe(request).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.recipe.set(res);
      },
      error: () => {
        this.isLoading.set(false);
        this.snackBar.open('Błąd podczas generowania przepisu. Spróbuj ponownie.', 'Zamknij', {
          duration: 3500
        });
      }
    });
  }

  onApplyToDiary(): void {
    const r = this.recipe();
    if (!r) return;

    this.isApplying.set(true);
    this.api
      .applyRecipe({
        consumedDate: this.data.date,
        mealType: this.selectedMealType,
        recipeTitle: r.title,
        ingredients: r.ingredients
      })
      .subscribe({
        next: (entries) => {
          this.isApplying.set(false);
          this.dialogRef.close({ applied: true, count: entries.length, title: r.title });
        },
        error: () => {
          this.isApplying.set(false);
          this.snackBar.open('Nie udało się dodać składników do dziennika.', 'Zamknij', {
            duration: 3500
          });
        }
      });
  }
}

