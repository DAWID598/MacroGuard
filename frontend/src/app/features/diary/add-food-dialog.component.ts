import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { CustomMealSetDto, FoodItemDto, MealType } from '../../core/models/api.models';
import { MacroApiService } from '../../core/services/macro-api.service';

export interface AddFoodDialogData {
  date: string;
  mealType: MealType;
  mealName: string;
}

@Component({
  selector: 'app-add-food-dialog',
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
    MatIconModule,
    MatTabsModule,
    MatChipsModule,
    MatSnackBarModule
  ],
  template: `
    <h2 mat-dialog-title class="dialog-title">
      <mat-icon color="primary">restaurant</mat-icon>
      Dodaj produkt — {{ data.mealName }}
    </h2>

    <mat-dialog-content class="dialog-body">
      <mat-tab-group [(selectedIndex)]="activeTabIndex" animationDuration="150ms">
        <!-- ZAKŁADKA 1: WYSZUKAJ PRODUKT Z BAZY -->
        <mat-tab label="Baza produktów">
          <div class="tab-pane">
            <div class="search-row">
              <mat-form-field appearance="outline" class="search-field">
                <mat-label>Wyszukaj produkt (np. kurczak, skyr, płatki...)</mat-label>
                <input
                  matInput
                  [(ngModel)]="searchQuery"
                  (ngModelChange)="loadFoods()"
                  placeholder="Wpisz nazwę produktu"
                />
                <mat-icon matSuffix>search</mat-icon>
              </mat-form-field>
            </div>

            <div class="category-chips">
              @for (cat of categories; track cat) {
                <button
                  type="button"
                  class="chip-btn"
                  [class.active]="selectedCategory() === cat"
                  (click)="selectCategory(cat)"
                >
                  {{ cat }}
                </button>
              }
            </div>

            <div class="food-list">
              @for (food of foods(); track food.id) {
                <div
                  class="food-item-row"
                  [class.selected]="selectedFood()?.id === food.id"
                  (click)="selectedFood.set(food)"
                >
                  <div class="food-info">
                    <div class="food-name">
                      {{ food.name }}
                      @if (food.brand) {
                        <span class="food-brand">({{ food.brand }})</span>
                      }
                    </div>
                    <div class="food-macros">
                      <span class="macro-badge kcal">{{ food.caloriesPer100g }} kcal / 100g</span>
                      <span class="macro-badge protein">B: {{ food.proteinPer100g }}g</span>
                      <span class="macro-badge carbs">W: {{ food.carbsPer100g }}g</span>
                      <span class="macro-badge fat">T: {{ food.fatPer100g }}g</span>
                    </div>
                  </div>
                  <mat-icon class="check-icon">
                    {{ selectedFood()?.id === food.id ? 'check_circle' : 'radio_button_unchecked' }}
                  </mat-icon>
                </div>
              } @empty {
                <div class="empty-foods">
                  Brak produktów spełniających kryteria. Dodaj własny w drugiej zakładce!
                </div>
              }
            </div>

            @if (selectedFood(); as chosen) {
              <div class="portion-box">
                <div class="portion-header">
                  <strong>Wybrano: {{ chosen.name }}</strong>
                </div>
                <div class="portion-controls">
                  <mat-form-field appearance="outline" class="gram-input">
                    <mat-label>Ilość (gramy)</mat-label>
                    <input
                      matInput
                      type="number"
                      min="1"
                      max="5000"
                      [ngModel]="weightGrams()"
                      (ngModelChange)="weightGrams.set(+$event || 0)"
                    />
                    <span matTextSuffix>g</span>
                  </mat-form-field>

                  <div class="quick-grams">
                    @for (g of [50, 100, 150, 200, 250]; track g) {
                      <button type="button" mat-stroked-button (click)="weightGrams.set(g)">
                        {{ g }}g
                      </button>
                    }
                  </div>
                </div>

                <div class="live-preview">
                  <span>Wyliczone wartości dla {{ weightGrams() }}g:</span>
                  <div class="preview-badges">
                    <span class="macro-badge kcal">{{ previewMacros().kcal }} kcal</span>
                    <span class="macro-badge protein">Białko: {{ previewMacros().protein }}g</span>
                    <span class="macro-badge carbs">Węgle: {{ previewMacros().carbs }}g</span>
                    <span class="macro-badge fat">Tłuszcz: {{ previewMacros().fat }}g</span>
                  </div>
                </div>
              </div>
            }
          </div>
        </mat-tab>

        <!-- ZAKŁADKA 2: DODAJ WŁASNY PRODUKT -->
        <mat-tab label="+ Własny produkt">
          <form [formGroup]="customFoodForm" (ngSubmit)="onCreateCustomFood()" class="custom-food-form">
            <div class="form-grid-2">
              <mat-form-field appearance="outline">
                <mat-label>Nazwa produktu</mat-label>
                <input matInput formControlName="name" placeholder="np. Skyr pitny waniliowy" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Marka / Producent (opcjonalnie)</mat-label>
                <input matInput formControlName="brand" placeholder="np. Piątnica" />
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline">
              <mat-label>Kategoria</mat-label>
              <mat-select formControlName="category">
                @for (cat of customCategories; track cat) {
                  <mat-option [value]="cat">{{ cat }}</mat-option>
                }
              </mat-select>
            </mat-form-field>

            <p class="section-hint">Wartości odżywcze w <strong>100 g</strong> produktu:</p>
            <div class="form-grid-4">
              <mat-form-field appearance="outline">
                <mat-label>Kalorie (kcal)</mat-label>
                <input matInput type="number" formControlName="caloriesPer100g" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Białko (g)</mat-label>
                <input matInput type="number" step="0.1" formControlName="proteinPer100g" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Węglowodany (g)</mat-label>
                <input matInput type="number" step="0.1" formControlName="carbsPer100g" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Tłuszcze (g)</mat-label>
                <input matInput type="number" step="0.1" formControlName="fatPer100g" />
              </mat-form-field>
            </div>

            <button
              mat-stroked-button
              color="primary"
              type="submit"
              [disabled]="customFoodForm.invalid || isSaving()"
            >
              <mat-icon>save</mat-icon>
              Zapisz produkt w bazie i wybierz go
            </button>
          </form>
        </mat-tab>

        <!-- ZAKŁADKA 3: MOJE ZESTAWY -->
        <mat-tab label="🍱 Moje Zestawy">
          <div class="tab-pane sets-pane">
            @if (mealSets().length === 0) {
              <div class="empty-sets-box">
                <mat-icon class="empty-icon">bookmark_border</mat-icon>
                <h3>Brak zapisanych zestawów</h3>
                <p>
                  Skomponuj swój ulubiony posiłek w dzienniku i kliknij przycisk
                  <strong>„Zapisz jako zestaw”</strong> na karcie posiłku, a pojawi się tutaj do wstawiania 1 kliknięciem!
                </p>
              </div>
            } @else {
              <div class="sets-list">
                @for (set of mealSets(); track set.id) {
                  <div class="meal-set-card">
                    <div class="set-header">
                      <div>
                        <strong class="set-name">{{ set.name }}</strong>
                        @if (set.description) {
                          <span class="set-desc">{{ set.description }}</span>
                        }
                      </div>
                      <button mat-icon-button color="warn" (click)="deleteMealSet(set, $event)" matTooltip="Usuń ten zestaw">
                        <mat-icon>delete_outline</mat-icon>
                      </button>
                    </div>

                    <div class="set-macros">
                      <span class="macro-pill kcal">{{ set.totalCalories | number:'1.0-0' }} kcal</span>
                      <span class="macro-pill protein">B: {{ set.totalProtein | number:'1.0-1' }}g</span>
                      <span class="macro-pill carbs">W: {{ set.totalCarbs | number:'1.0-1' }}g</span>
                      <span class="macro-pill fat">T: {{ set.totalFat | number:'1.0-1' }}g</span>
                    </div>

                    <div class="set-items-preview">
                      Składniki ({{ set.itemsCount }}):
                      @for (item of set.items; track item.id; let last = $last) {
                        <span>{{ item.foodName }} ({{ item.weightGrams }}g){{ last ? '' : ', ' }}</span>
                      }
                    </div>

                    <button 
                      mat-flat-button 
                      color="primary" 
                      class="apply-set-btn" 
                      [disabled]="isSaving()"
                      (click)="applyMealSet(set)">
                      <mat-icon>playlist_add_check</mat-icon>
                      Wstaw ten zestaw do {{ data.mealName }}
                    </button>
                  </div>
                }
              </div>
            }
          </div>
        </mat-tab>
      </mat-tab-group>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Anuluj</button>
      <button
        mat-flat-button
        color="primary"
        [disabled]="!selectedFood() || weightGrams() <= 0 || isSaving()"
        (click)="onConfirmAddEntry()"
      >
        <mat-icon>add_circle</mat-icon>
        Dodaj do posiłku ({{ data.mealName }})
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-title {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0;
      font-weight: 700;
    }

    .dialog-body {
      min-width: 580px;
      max-width: 100%;
    }

    @media (max-width: 680px) {
      .dialog-body {
        min-width: unset;
      }
    }

    .tab-pane {
      padding-top: 14px;
    }

    .search-field {
      width: 100%;
    }

    .category-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 12px;
    }

    .chip-btn {
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      color: #334155;
      padding: 5px 12px;
      border-radius: 16px;
      font-size: 12.5px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;

      &.active {
        background: #3f51b5;
        color: #ffffff;
        border-color: #3f51b5;
      }
    }

    .food-list {
      max-height: 240px;
      overflow-y: auto;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      margin-bottom: 14px;
    }

    .food-item-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      border-bottom: 1px solid #f1f5f9;
      cursor: pointer;
      transition: background 0.15s;

      &:hover {
        background: #f8fafc;
      }

      &.selected {
        background: #eef2ff;
      }

      .food-name {
        font-weight: 600;
        font-size: 14px;
        margin-bottom: 4px;
        color: #0f172a;
      }

      .food-brand {
        font-weight: 400;
        color: #64748b;
        font-size: 12.5px;
        margin-left: 4px;
      }

      .check-icon {
        color: #3f51b5;
      }
    }

    .empty-foods {
      padding: 24px;
      text-align: center;
      color: #64748b;
      font-size: 13.5px;
    }

    .portion-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      padding: 14px;
    }

    .portion-header {
      margin-bottom: 10px;
      color: #1e293b;
    }

    .portion-controls {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;

      .gram-input {
        width: 150px;
      }

      .quick-grams {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
    }

    .live-preview {
      margin-top: 6px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      font-size: 13px;
      color: #475569;
    }

    .custom-food-form {
      padding-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }

    .form-grid-4 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .section-hint {
      margin: 0 0 6px;
      font-size: 13px;
      color: #475569;
    }

    .sets-pane {
      padding-top: 14px;
    }

    .empty-sets-box {
      text-align: center;
      padding: 36px 16px;
      color: #64748b;

      .empty-icon {
        font-size: 44px;
        width: 44px;
        height: 44px;
        color: #94a3b8;
        margin-bottom: 8px;
      }

      h3 {
        margin: 0 0 6px;
        color: #1e293b;
      }

      p {
        margin: 0 auto;
        max-width: 420px;
        font-size: 13.5px;
        line-height: 1.5;
      }
    }

    .sets-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: 380px;
      overflow-y: auto;
      padding-right: 4px;
    }

    .meal-set-card {
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px;
      background: #ffffff;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.02);
      display: flex;
      flex-direction: column;
      gap: 10px;

      .set-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;

        .set-name {
          font-size: 15px;
          color: #0f172a;
          display: block;
        }

        .set-desc {
          font-size: 12.5px;
          color: #64748b;
        }
      }

      .set-macros {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;

        .macro-pill {
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 700;

          &.kcal { background: #fef3c7; color: #b45309; }
          &.protein { background: #e0e7ff; color: #4338ca; }
          &.carbs { background: #dbeafe; color: #1d4ed8; }
          &.fat { background: #fae8ff; color: #86198f; }
        }
      }

      .set-items-preview {
        font-size: 12.5px;
        color: #475569;
        background: #f8fafc;
        padding: 8px 10px;
        border-radius: 8px;
        line-height: 1.4;
      }

      .apply-set-btn {
        border-radius: 8px;
        font-weight: 600;
        height: 38px;
      }
    }
  `]
})
export class AddFoodDialogComponent implements OnInit {
  private readonly api = inject(MacroApiService);
  private readonly fb = inject(FormBuilder);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject(MatDialogRef<AddFoodDialogComponent>);

  constructor(@Inject(MAT_DIALOG_DATA) public data: AddFoodDialogData) {}

  activeTabIndex = 0;
  searchQuery = '';
  readonly selectedCategory = signal<string>('Wszystkie');
  readonly foods = signal<FoodItemDto[]>([]);
  readonly selectedFood = signal<FoodItemDto | null>(null);
  readonly mealSets = signal<CustomMealSetDto[]>([]);
  readonly weightGrams = signal<number>(100);
  readonly isSaving = signal<boolean>(false);

  readonly categories = [
    'Wszystkie',
    'Tłuszcze i Oleje',
    'Mięso i Ryby',
    'Nabiał i Jaja',
    'Zboża i Pieczywo',
    'Warzywa i Owoce',
    'Tłuszcze i Orzechy',
    'Odżywki i Przekąski'
  ];

  readonly customCategories = this.categories.filter((c) => c !== 'Wszystkie');

  readonly previewMacros = computed(() => {
    const food = this.selectedFood();
    const grams = this.weightGrams();
    if (!food || grams <= 0) {
      return { kcal: 0, protein: 0, carbs: 0, fat: 0 };
    }
    const ratio = grams / 100;
    return {
      kcal: Math.round(food.caloriesPer100g * ratio * 10) / 10,
      protein: Math.round(food.proteinPer100g * ratio * 10) / 10,
      carbs: Math.round(food.carbsPer100g * ratio * 10) / 10,
      fat: Math.round(food.fatPer100g * ratio * 10) / 10
    };
  });

  readonly customFoodForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    brand: [''],
    category: ['Nabiał i Jaja', [Validators.required]],
    caloriesPer100g: [100, [Validators.required, Validators.min(0), Validators.max(1000)]],
    proteinPer100g: [10, [Validators.required, Validators.min(0), Validators.max(100)]],
    carbsPer100g: [10, [Validators.required, Validators.min(0), Validators.max(100)]],
    fatPer100g: [2, [Validators.required, Validators.min(0), Validators.max(100)]]
  });

  ngOnInit(): void {
    this.loadFoods();
    this.loadMealSets();
  }

  loadMealSets(): void {
    this.api.getCustomMealSets().subscribe({
      next: (sets) => {
        this.mealSets.set(sets);
      },
      error: () => {}
    });
  }

  applyMealSet(set: CustomMealSetDto): void {
    this.isSaving.set(true);
    this.api.applyCustomMealSet(set.id, {
      targetDate: this.data.date,
      targetMealType: this.data.mealType
    }).subscribe({
      next: (entries) => {
        this.isSaving.set(false);
        this.snackBar.open(`Wstawiono zestaw "${set.name}" (${entries.length} składników)!`, 'OK', { duration: 3000 });
        this.dialogRef.close(entries);
      },
      error: () => {
        this.isSaving.set(false);
        this.snackBar.open('Błąd podczas wstawiania zestawu do posiłku.', 'Zamknij', { duration: 3000 });
      }
    });
  }

  deleteMealSet(set: CustomMealSetDto, event: MouseEvent): void {
    event.stopPropagation();
    if (!confirm(`Czy na pewno chcesz usunąć zestaw "${set.name}"?`)) return;

    this.api.deleteCustomMealSet(set.id).subscribe({
      next: () => {
        this.mealSets.update(prev => prev.filter(s => s.id !== set.id));
        this.snackBar.open(`Usunięto zestaw "${set.name}".`, 'OK', { duration: 2500 });
      },
      error: () => {
        this.snackBar.open('Błąd podczas usuwania zestawu.', 'Zamknij', { duration: 3000 });
      }
    });
  }

  selectCategory(category: string): void {
    this.selectedCategory.set(category);
    this.loadFoods();
  }

  loadFoods(): void {
    this.api.searchFoods(this.searchQuery, this.selectedCategory()).subscribe({
      next: (list) => {
        this.foods.set(list);
        if (!this.selectedFood() && list.length > 0) {
          this.selectedFood.set(list[0]);
        }
      }
    });
  }

  onCreateCustomFood(): void {
    if (this.customFoodForm.invalid) return;
    this.isSaving.set(true);

    this.api.createFood(this.customFoodForm.getRawValue()).subscribe({
      next: (created) => {
        this.isSaving.set(false);
        this.foods.update((prev) => [created, ...prev]);
        this.selectedFood.set(created);
        this.activeTabIndex = 0;
        this.snackBar.open(`Dodano produkt "${created.name}" do bazy!`, 'OK', { duration: 2500 });
      },
      error: () => {
        this.isSaving.set(false);
        this.snackBar.open('Błąd podczas zapisywania produktu.', 'Zamknij', { duration: 3000 });
      }
    });
  }

  onConfirmAddEntry(): void {
    const food = this.selectedFood();
    if (!food || this.weightGrams() <= 0) return;

    this.isSaving.set(true);
    this.api
      .addMealEntry({
        foodItemId: food.id,
        consumedDate: this.data.date,
        mealType: this.data.mealType,
        weightGrams: this.weightGrams()
      })
      .subscribe({
        next: (entry) => {
          this.isSaving.set(false);
          this.dialogRef.close(entry);
        },
        error: () => {
          this.isSaving.set(false);
          this.snackBar.open('Nie udało się dodać wpisu do dziennika.', 'Zamknij', { duration: 3000 });
        }
      });
  }
}

