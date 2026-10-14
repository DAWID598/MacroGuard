import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { debounceTime } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  ActivityLevel,
  DietGoal,
  Gender,
  MacroCalculationResult
} from '../../core/models/api.models';
import { MacroApiService } from '../../core/services/macro-api.service';

@Component({
  selector: 'app-calculator',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="page-container">
      <div class="calc-header">
        <div class="header-content">
          <div>
            <h1>Kalkulator Zapotrzebowania (BMR / TDEE) i Profil</h1>
            <p>
              Wylicz swoje dzienne zapotrzebowanie kaloryczne wg wzoru <strong>Mifflin-St Jeor</strong> oraz optymalny rozkład białka, węglowodanów i tłuszczów.
            </p>
          </div>
          <a mat-stroked-button color="primary" routerLink="/guide" class="guide-header-btn">
            <mat-icon>school</mat-icon>
            Przewodnik: Jak działa BMR & TDEE?
          </a>
        </div>
      </div>

      <div class="calc-layout">
        <!-- FORMULARZ PARAMETRÓW CIAŁA -->
        <mat-card class="form-card" appearance="outlined">
          <h3>Twoje parametry</h3>

          <form [formGroup]="profileForm" (ngSubmit)="onSave()" class="calc-form">
            <div class="gender-row">
              <label class="field-label">Płeć:</label>
              <mat-radio-group formControlName="gender">
                <mat-radio-button [value]="Gender.Male">Mężczyzna</mat-radio-button>
                <mat-radio-button [value]="Gender.Female">Kobieta</mat-radio-button>
              </mat-radio-group>
            </div>

            <div class="grid-3">
              <mat-form-field appearance="outline">
                <mat-label>Wiek (lata)</mat-label>
                <input matInput type="number" formControlName="age" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Masa ciała (kg)</mat-label>
                <input matInput type="number" step="0.5" formControlName="weightKg" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Wzrost (cm)</mat-label>
                <input matInput type="number" formControlName="heightCm" />
              </mat-form-field>
            </div>

            <mat-form-field appearance="outline">
              <mat-label>Poziom aktywności fizycznej (PAL)</mat-label>
              <mat-select formControlName="activityLevel">
                <mat-option [value]="ActivityLevel.Sedentary">
                  Siedzący (1.2) — praca biurowa, brak treningów
                </mat-option>
                <mat-option [value]="ActivityLevel.LightlyActive">
                  Lekka aktywność (1.375) — 1–3 treningi tygodniowo
                </mat-option>
                <mat-option [value]="ActivityLevel.ModeratelyActive">
                  Umiarkowana aktywność (1.55) — 3–5 treningów tygodniowo
                </mat-option>
                <mat-option [value]="ActivityLevel.VeryActive">
                  Duża aktywność (1.725) — 6–7 intensywnych treningów
                </mat-option>
                <mat-option [value]="ActivityLevel.ExtraActive">
                  Bardzo duża aktywność (1.9) — sport wyczynowy / praca fizyczna
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>Twój cel sylwetkowy</mat-label>
              <mat-select formControlName="goal">
                <mat-option [value]="DietGoal.Cut">
                  Redukcja tkanki tłuszczowej (-15% kalorii, wyższe białko 2.0g/kg)
                </mat-option>
                <mat-option [value]="DietGoal.Maintain">
                  Utrzymanie masy ciała (100% TDEE — zero kaloryczne)
                </mat-option>
                <mat-option [value]="DietGoal.Bulk">
                  Budowa masy mięśniowej (+12% kalorii nadwyżki)
                </mat-option>
              </mat-select>
            </mat-form-field>

            <button
              mat-flat-button
              color="primary"
              type="submit"
              class="save-btn"
              [disabled]="profileForm.invalid || isSaving()"
            >
              <mat-icon>check_circle</mat-icon>
              Zapisz cele i przejdź do Dziennika
            </button>
          </form>
        </mat-card>

        <!-- WYNIKI KALKULATORA NA ŻYWO -->
        <mat-card class="result-card" appearance="outlined">
          <h3>Wyliczone zapotrzebowanie</h3>

          @if (preview(); as res) {
            <div class="metrics-row">
              <div class="metric-item">
                <span class="m-label">BMR (Podstawowa przemiana)</span>
                <strong class="m-val">{{ res.bmrCalories }} kcal</strong>
                <span class="m-desc">Spalanie w spoczynku</span>
              </div>

              <div class="metric-item">
                <span class="m-label">TDEE (Zero kaloryczne)</span>
                <strong class="m-val">{{ res.tdeeCalories }} kcal</strong>
                <span class="m-desc">Z uwzględnieniem aktywności</span>
              </div>
            </div>

            <div class="target-highlight">
              <span class="t-title">Twój docelowy bilans dzienny</span>
              <div class="t-kcal">{{ res.targetCalories }} <span>kcal / dzień</span></div>
            </div>

            <mat-divider></mat-divider>

            <h4 class="macro-split-title">Rekomendowany rozkład makroskładników:</h4>
            <div class="macro-cards">
              <div class="m-card protein">
                <span class="m-name">Białko</span>
                <strong>{{ res.targetProteinGrams }} g</strong>
                <small>{{ res.targetProteinGrams * 4 }} kcal</small>
              </div>

              <div class="m-card carbs">
                <span class="m-name">Węglowodany</span>
                <strong>{{ res.targetCarbsGrams }} g</strong>
                <small>{{ res.targetCarbsGrams * 4 }} kcal</small>
              </div>

              <div class="m-card fat">
                <span class="m-name">Tłuszcze</span>
                <strong>{{ res.targetFatGrams }} g</strong>
                <small>{{ res.targetFatGrams * 9 }} kcal</small>
              </div>
            </div>
          }
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .calc-header {
      margin-bottom: 24px;

      .header-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 16px;
      }

      h1 {
        margin: 0 0 6px;
        font-size: 26px;
        font-weight: 700;
        color: #0f172a;
      }
      p {
        margin: 0;
        color: #64748b;
        font-size: 14px;
      }

      .guide-header-btn {
        border-radius: 10px;
        font-weight: 600;
        height: 40px;
      }
    }

    .calc-layout {
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 24px;
      align-items: start;
    }

    @media (max-width: 900px) {
      .calc-layout {
        grid-template-columns: 1fr;
      }
    }

    .form-card, .result-card {
      padding: 24px;
      border-radius: 16px;
      background: #ffffff;

      h3 {
        margin: 0 0 18px;
        font-size: 18px;
        font-weight: 700;
        color: #0f172a;
      }
    }

    .calc-form {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .gender-row {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 8px;

      .field-label {
        font-weight: 600;
        color: #334155;
      }

      mat-radio-group {
        display: flex;
        gap: 16px;
      }
    }

    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }

    @media (max-width: 600px) {
      .grid-3 {
        grid-template-columns: 1fr;
      }
    }

    .save-btn {
      height: 48px;
      font-size: 15px;
      font-weight: 600;
      border-radius: 10px;
      margin-top: 8px;
    }

    .metrics-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 16px;
    }

    .metric-item {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px;
      display: flex;
      flex-direction: column;

      .m-label {
        font-size: 12px;
        font-weight: 600;
        color: #64748b;
      }
      .m-val {
        font-size: 22px;
        font-weight: 700;
        color: #0f172a;
        margin: 4px 0;
      }
      .m-desc {
        font-size: 11.5px;
        color: #94a3b8;
      }
    }

    .target-highlight {
      background: linear-gradient(135deg, #3f51b5, #4f46e5);
      color: #ffffff;
      border-radius: 14px;
      padding: 20px;
      text-align: center;
      margin-bottom: 20px;

      .t-title {
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        opacity: 0.9;
      }

      .t-kcal {
        font-size: 36px;
        font-weight: 800;
        margin-top: 4px;

        span {
          font-size: 16px;
          font-weight: 500;
          opacity: 0.9;
        }
      }
    }

    .macro-split-title {
      margin: 18px 0 12px;
      font-size: 14px;
      font-weight: 600;
      color: #334155;
    }

    .macro-cards {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
    }

    .m-card {
      padding: 14px 10px;
      border-radius: 12px;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 4px;

      .m-name {
        font-size: 12.5px;
        font-weight: 600;
      }
      strong {
        font-size: 22px;
        font-weight: 800;
      }
      small {
        font-size: 11.5px;
        opacity: 0.8;
      }

      &.protein {
        background: #dcfce7;
        color: #166534;
      }
      &.carbs {
        background: #fef3c7;
        color: #92400e;
      }
      &.fat {
        background: #fce7f3;
        color: #9d174d;
      }
    }
  `]
})
export class CalculatorComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(MacroApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  readonly Gender = Gender;
  readonly ActivityLevel = ActivityLevel;
  readonly DietGoal = DietGoal;

  readonly isSaving = signal(false);
  readonly preview = signal<MacroCalculationResult | null>(null);

  readonly profileForm = this.fb.nonNullable.group({
    gender: [Gender.Male, [Validators.required]],
    age: [25, [Validators.required, Validators.min(12), Validators.max(120)]],
    weightKg: [75, [Validators.required, Validators.min(30), Validators.max(300)]],
    heightCm: [178, [Validators.required, Validators.min(100), Validators.max(250)]],
    activityLevel: [ActivityLevel.ModeratelyActive, [Validators.required]],
    goal: [DietGoal.Maintain, [Validators.required]]
  });

  ngOnInit(): void {
    // Reaktywne odpytywanie API z debouncem przy zmianach w formularzu
    this.profileForm.valueChanges
      .pipe(debounceTime(250))
      .subscribe(() => this.recalculatePreview());

    this.recalculatePreview();

    this.api.getProfile().subscribe({
      next: (profile) => {
        this.profileForm.patchValue({
          gender: profile.gender,
          age: profile.age,
          weightKg: profile.weightKg,
          heightCm: profile.heightCm,
          activityLevel: profile.activityLevel,
          goal: profile.goal
        });
        this.recalculatePreview();
      }
    });
  }

  recalculatePreview(): void {
    if (this.profileForm.invalid) return;

    // Pobranie kalkulacji z backendu (.NET Domain Layer - MacroCalculator)
    this.api.previewCalculation(this.profileForm.getRawValue()).subscribe({
      next: (result) => this.preview.set(result),
      error: () => {
        // Cichy błąd jeśli API jeszcze się uruchamia lub trwają zmiany
      }
    });
  }

  onSave(): void {
    if (this.profileForm.invalid) return;
    this.isSaving.set(true);

    this.api.calculateAndSaveProfile(this.profileForm.getRawValue()).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.snackBar.open('Twoje cele kaloryczne i makro zostały zapisane!', 'OK', {
          duration: 3000
        });
        this.router.navigate(['/diary']);
      },
      error: () => {
        this.isSaving.set(false);
        this.snackBar.open('Błąd podczas zapisu profilu.', 'Zamknij', { duration: 3000 });
      }
    });
  }
}

