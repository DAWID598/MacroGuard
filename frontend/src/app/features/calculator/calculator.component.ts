import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { MatTooltipModule } from '@angular/material/tooltip';
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
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatSnackBarModule,
    MatTooltipModule
  ],
  template: `
    <div class="page-container">
      <div class="calc-header">
        <div class="header-content">
          <div>
            <h1>Kalkulator Zapotrzebowania (BMR / TDEE) i Cele Sylwetkowe</h1>
            <p>
              Wylicz dzienne zapotrzebowanie kaloryczne wg wzoru <strong>Mifflin-St Jeor</strong>, 
              skonfiguruj docelową wagę, tempo redukcji oraz optymalny rozkład makroskładników.
            </p>
          </div>
          <a mat-stroked-button color="primary" routerLink="/guide" class="guide-header-btn">
            <mat-icon>school</mat-icon>
            Przewodnik: Jak działa BMR & TDEE?
          </a>
        </div>
      </div>

      <div class="calc-layout">
        <!-- FORMULARZ PARAMETRÓW CIAŁA I CELÓW -->
        <mat-card class="form-card" appearance="outlined">
          <h3>Twoje parametry & Cele</h3>

          <form [formGroup]="profileForm" (ngSubmit)="onSave()" class="calc-form">
            <!-- PŁEĆ -->
            <div class="gender-row">
              <label class="field-label">Płeć:</label>
              <mat-radio-group formControlName="gender">
                <mat-radio-button [value]="Gender.Male">Mężczyzna</mat-radio-button>
                <mat-radio-button [value]="Gender.Female">Kobieta</mat-radio-button>
              </mat-radio-group>
            </div>

            <!-- WIEK, WAGA, WZROST -->
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

            <!-- AKTYWNOŚĆ FIZYCZNA (PAL) -->
            <mat-form-field appearance="outline">
              <mat-label>Poziom aktywności fizycznej (PAL)</mat-label>
              <mat-select formControlName="activityLevel">
                <mat-option [value]="ActivityLevel.Sedentary">
                  Siedzący (1.2) — praca biurowa / zdalna, brak treningów (&lt; 5 tys. kroków)
                </mat-option>
                <mat-option [value]="ActivityLevel.LightlyActive">
                  Lekka aktywność (1.375) — 1–3 treningi tygodniowo lub praca w ruchu / stojąca
                </mat-option>
                <mat-option [value]="ActivityLevel.ModeratelyActive">
                  Umiarkowana aktywność (1.55) — 3–5 regularnych treningów w tygodniu (siłownia, bieganie)
                </mat-option>
                <mat-option [value]="ActivityLevel.PhysicalWork">
                  🛠️ Sama praca fizyczna bez treningów (1.6) — magazyn, budowa, kurier, gastronomia (cały dzień w ruchu)
                </mat-option>
                <mat-option [value]="ActivityLevel.VeryActive">
                  Duża aktywność (1.725) — 6–7 ciężkich treningów LUB praca fizyczna + treningi
                </mat-option>
                <mat-option [value]="ActivityLevel.ExtraActive">
                  Ekstremalna aktywność (1.9) — ciężka praca fizyczna + codzienne treningi / sport zawodowy
                </mat-option>
              </mat-select>
            </mat-form-field>

            <!-- CEL GŁÓWNY -->
            <mat-form-field appearance="outline">
              <mat-label>Twój cel sylwetkowy</mat-label>
              <mat-select formControlName="goal" (selectionChange)="onGoalSelect($event.value)">
                <mat-option [value]="DietGoal.Cut">
                  Redukcja tkanki tłuszczowej (Odchudzanie / Deficyt)
                </mat-option>
                <mat-option [value]="DietGoal.Maintain">
                  Utrzymanie masy ciała (Zero kaloryczne — 100% TDEE)
                </mat-option>
                <mat-option [value]="DietGoal.Bulk">
                  Budowa masy mięśniowej (Nadwyżka kaloryczna)
                </mat-option>
              </mat-select>
            </mat-form-field>

            <!-- SEKCJA SZCZEGÓŁOWA: REDUKCJA -->
            @if (profileForm.get('goal')?.value === DietGoal.Cut) {
              <div class="goal-config-box cut-theme">
                <div class="config-header">
                  <mat-icon class="icon-cut">trending_down</mat-icon>
                  <div>
                    <strong>Konfiguracja celu odchudzania</strong>
                    <span>Określ ile chcesz schudnąć oraz jak szybko</span>
                  </div>
                </div>

                <!-- WAGA DOCELOWA -->
                <div class="target-weight-input-row">
                  <mat-form-field appearance="outline" class="target-weight-field">
                    <mat-label>Twoja docelowa masa ciała (kg)</mat-label>
                    <input 
                      matInput 
                      type="number" 
                      step="0.5" 
                      formControlName="targetWeightKg" 
                      placeholder="np. 70.0" 
                    />
                    <span matSuffix class="suffix-text">kg</span>
                    @if (profileForm.get('targetWeightKg')?.value; as tw) {
                      <mat-hint>
                        @if (currentWeight - tw > 0) {
                          <span class="hint-pill hint-green">
                            🎯 Cel: schudnąć {{ (currentWeight - tw) | number:'1.1-1' }} kg
                          </span>
                        } @else if (currentWeight - tw === 0) {
                          <span class="hint-pill hint-neutral">Waga docelowa równa obecnej</span>
                        } @else {
                          <span class="hint-pill hint-amber">⚠️ Na redukcji waga docelowa powinna być niższa</span>
                        }
                      </mat-hint>
                    }
                  </mat-form-field>
                </div>

                <!-- PRESETY DEFICYTU -->
                <div class="presets-section">
                  <label class="presets-label">Wybierz tempo redukcji / deficyt kaloryczny:</label>
                  
                  <div class="presets-grid">
                    <button 
                      type="button" 
                      class="preset-tile"
                      [class.active]="selectedDeficitPreset() === 10"
                      (click)="setDeficit(10)">
                      <div class="tile-top">
                        <span class="tile-title">Łagodne</span>
                        <span class="tile-pct">-10%</span>
                      </div>
                      <div class="tile-rate">~0.25 - 0.3 kg / tydz</div>
                      <div class="tile-desc">Praktycznie bez uczucia głodu, wysoki komfort</div>
                    </button>

                    <button 
                      type="button" 
                      class="preset-tile featured"
                      [class.active]="selectedDeficitPreset() === 15"
                      (click)="setDeficit(15)">
                      <div class="tile-badge">Polecane</div>
                      <div class="tile-top">
                        <span class="tile-title">Standardowe</span>
                        <span class="tile-pct">-15%</span>
                      </div>
                      <div class="tile-rate">~0.5 kg / tydz</div>
                      <div class="tile-desc">Złoty standard dietetyki, ochrona mięśni</div>
                    </button>

                    <button 
                      type="button" 
                      class="preset-tile"
                      [class.active]="selectedDeficitPreset() === 20"
                      (click)="setDeficit(20)">
                      <div class="tile-top">
                        <span class="tile-title">Dynamiczne</span>
                        <span class="tile-pct">-20%</span>
                      </div>
                      <div class="tile-rate">~0.75 kg / tydz</div>
                      <div class="tile-desc">Wyraźny deficyt, szybsze rezultaty</div>
                    </button>

                    <button 
                      type="button" 
                      class="preset-tile"
                      [class.active]="selectedDeficitPreset() === 25"
                      (click)="setDeficit(25)">
                      <div class="tile-top">
                        <span class="tile-title">Mocne</span>
                        <span class="tile-pct">-25%</span>
                      </div>
                      <div class="tile-rate">~1.0 kg / tydz</div>
                      <div class="tile-desc">Agresywna redukcja, wymaga żelaznej dyscypliny</div>
                    </button>

                    <button 
                      type="button" 
                      class="preset-tile custom-tile"
                      [class.active]="selectedDeficitPreset() === -1"
                      (click)="setCustomDeficit()">
                      <div class="tile-top">
                        <span class="tile-title">Własny %</span>
                        <span class="tile-pct">{{ isCustomDeficit() ? '-' + profileForm.get('deficitPercentage')?.value + '%' : '⚙️' }}</span>
                      </div>
                      <div class="tile-rate">Dowolne cięcie</div>
                      <div class="tile-desc">Wpisz swój procent deficytu</div>
                    </button>
                  </div>

                  @if (isCustomDeficit()) {
                    <div class="custom-pct-box">
                      <mat-form-field appearance="outline" class="custom-field">
                        <mat-label>Wpisz procent deficytu (%)</mat-label>
                        <input matInput type="number" min="5" max="35" formControlName="deficitPercentage" />
                        <span matSuffix class="suffix-text">%</span>
                        <mat-hint>Zalecany bezpieczny zakres: 10% – 25% TDEE</mat-hint>
                      </mat-form-field>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- SEKCJA SZCZEGÓŁOWA: BUDOWA MASY -->
            @if (profileForm.get('goal')?.value === DietGoal.Bulk) {
              <div class="goal-config-box bulk-theme">
                <div class="config-header">
                  <mat-icon class="icon-bulk">trending_up</mat-icon>
                  <div>
                    <strong>Konfiguracja celu budowy masy</strong>
                    <span>Określ docelową wagę i tempo nadwyżki</span>
                  </div>
                </div>

                <!-- WAŻNA WSKAZÓWKA O TRENINGU SIŁOWYM -->
                <div class="strength-training-alert">
                  <div class="alert-icon-title">
                    <mat-icon>fitness_center</mat-icon>
                    <strong>Kluczowa zasada: Do budowy mięśni niezbędny jest trening siłowy!</strong>
                  </div>
                  <p>
                    Sama nadwyżka kaloryczna bez bodźca do wzrostu zamieni się w tkankę tłuszczową! 
                    Aby budować <strong>mięśnie, a nie tłuszcz</strong>, połącz kalorie z <strong>treningiem siłowym</strong> 
                    (siłownia, hantle, kalistenika z progresją obciążeń) oraz wysoką podażą <strong>białka</strong> 
                    (1.8–2.2 g na każdy kilogram masy ciała).
                  </p>
                </div>

                <div class="target-weight-input-row">
                  <mat-form-field appearance="outline" class="target-weight-field">
                    <mat-label>Twoja docelowa masa ciała (kg)</mat-label>
                    <input 
                      matInput 
                      type="number" 
                      step="0.5" 
                      formControlName="targetWeightKg" 
                      placeholder="np. 80.0" 
                    />
                    <span matSuffix class="suffix-text">kg</span>
                    @if (profileForm.get('targetWeightKg')?.value; as tw) {
                      <mat-hint>
                        @if (tw - currentWeight > 0) {
                          <span class="hint-pill hint-green">
                            💪 Cel: zbudować +{{ (tw - currentWeight) | number:'1.1-1' }} kg
                          </span>
                        } @else {
                          <span class="hint-pill hint-amber">⚠️ Na masie waga docelowa powinna być wyższa</span>
                        }
                      </mat-hint>
                    }
                  </mat-form-field>
                </div>

                <div class="presets-section">
                  <label class="presets-label">Wybierz tempo budowy masy (nadwyżka):</label>
                  <div class="presets-grid bulk-grid">
                    <button 
                      type="button" 
                      class="preset-tile featured"
                      [class.active]="selectedDeficitPreset() === 10"
                      (click)="setDeficit(10)">
                      <div class="tile-badge">Polecane</div>
                      <div class="tile-top">
                        <span class="tile-title">Czysta masa (Lean Bulk)</span>
                        <span class="tile-pct">+10%</span>
                      </div>
                      <div class="tile-rate">~0.25 kg / tydz</div>
                      <div class="tile-desc">Optymalny przyrost mięśni, minimalne odkładanie tłuszczu</div>
                    </button>

                    <button 
                      type="button" 
                      class="preset-tile"
                      [class.active]="selectedDeficitPreset() === 15"
                      (click)="setDeficit(15)">
                      <div class="tile-top">
                        <span class="tile-title">Standardowa masa</span>
                        <span class="tile-pct">+15%</span>
                      </div>
                      <div class="tile-rate">~0.4 kg / tydz</div>
                      <div class="tile-desc">Solidna nadwyżka dla osób z szybkim metabolizmem</div>
                    </button>

                    <button 
                      type="button" 
                      class="preset-tile custom-tile"
                      [class.active]="selectedDeficitPreset() === -1"
                      (click)="setCustomDeficit()">
                      <div class="tile-top">
                        <span class="tile-title">Własny %</span>
                        <span class="tile-pct">{{ isCustomDeficit() ? '+' + profileForm.get('deficitPercentage')?.value + '%' : '⚙️' }}</span>
                      </div>
                      <div class="tile-rate">Wpisz nadwyżkę</div>
                      <div class="tile-desc">Dowolny procent (5% – 25%)</div>
                    </button>
                  </div>

                  @if (isCustomDeficit()) {
                    <div class="custom-pct-box">
                      <mat-form-field appearance="outline" class="custom-field">
                        <mat-label>Wpisz procent nadwyżki (%)</mat-label>
                        <input matInput type="number" min="5" max="25" formControlName="deficitPercentage" />
                        <span matSuffix class="suffix-text">%</span>
                      </mat-form-field>
                    </div>
                  }
                </div>
              </div>
            }

            <!-- SEKCJA SZCZEGÓŁOWA: UTRZYMANIE (ZERO KALORYCZNE) -->
            @if (profileForm.get('goal')?.value === DietGoal.Maintain) {
              <div class="goal-config-box maintain-theme">
                <div class="config-header">
                  <mat-icon class="icon-maintain">balance</mat-icon>
                  <div>
                    <strong>Zero kaloryczne (100% TDEE)</strong>
                    <span>Dostarczasz dokładnie tyle energii, ile zużywasz w ciągu dnia</span>
                  </div>
                </div>
                <p class="maintain-info">
                  W tym trybie waga ciała pozostaje stabilna. To znakomity wybór na okres stabilizacji wagi po odchudzaniu, 
                  rekompozycję składu ciała (budowa mięśni przy jednoczesnym delikatnym spalaniu tłuszczu u początkujących) 
                  lub po prostu utrzymanie świetnej formy!
                </p>
              </div>
            }

            <!-- PRZYCISK ZAPISU -->
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

        <!-- WYNIKI KALKULATORA NA ŻYWO (PRAWA KOLUMNA) -->
        <mat-card class="result-card" appearance="outlined">
          <h3>Wyliczone zapotrzebowanie na żywo</h3>

          @if (preview(); as res) {
            <!-- BMR & TDEE -->
            <div class="metrics-row">
              <div class="metric-item">
                <span class="m-label">BMR (Podstawa metabolizmu)</span>
                <strong class="m-val">{{ res.bmrCalories }} kcal</strong>
                <span class="m-desc">Spalanie organizmu w spoczynku</span>
              </div>

              <div class="metric-item">
                <span class="m-label">TDEE (Zero kaloryczne)</span>
                <strong class="m-val">{{ res.tdeeCalories }} kcal</strong>
                <span class="m-desc">Zapotrzebowanie z aktywnością</span>
              </div>
            </div>

            <!-- GŁÓWNA KARTA TARGET KALORII -->
            <div class="target-highlight">
              <span class="t-title">Twój docelowy bilans dzienny</span>
              <div class="t-kcal">{{ res.targetCalories }} <span>kcal / dzień</span></div>

              @if (res.deficitCalories && profileForm.get('goal')?.value === DietGoal.Cut) {
                <div class="t-subtext">
                  Deficyt: <strong>-{{ res.deficitCalories }} kcal</strong> dziennie 
                  (tempo: <strong>~{{ res.weeklyChangeKg ?? '0.5' }} kg</strong> / tydzień)
                </div>
              } @else if (res.deficitCalories && profileForm.get('goal')?.value === DietGoal.Bulk) {
                <div class="t-subtext">
                  Nadwyżka: <strong>+{{ res.deficitCalories }} kcal</strong> dziennie 
                  (tempo: <strong>~+{{ res.weeklyChangeKg ?? '0.25' }} kg</strong> / tydzień)
                </div>
              } @else {
                <div class="t-subtext">
                  Zero kaloryczne — pełna stabilizacja wagi
                </div>
              }
            </div>

            <!-- OSTRZEŻENIE BMR (JEŚLI DEFICYT JEST ZBYT AGRESYWNY) -->
            @if (res.isBelowBmr) {
              <div class="bmr-alert">
                <mat-icon>warning</mat-icon>
                <div>
                  <strong>Uwaga: kalorie poniżej BMR ({{ res.bmrCalories }} kcal)</strong>
                  <p>
                    Twój docelowy limit ({{ res.targetCalories }} kcal) jest niższy niż podstawowa przemiana materii Twojego ciała. 
                    Długotrwałe jedzenie poniżej BMR może powodować zmęczenie i spadek masy mięśniowej. 
                    Rozważ łagodniejsze tempo deficytu (-10% lub -15%).
                  </p>
                </div>
              </div>
            }

            <!-- PLAN OSIĄGNIĘCIA WAGI DOCELOWEJ (JEŚLI PODANO CEL) -->
            @if (res.targetWeightKg && res.weightDifferenceKg && res.weightDifferenceKg > 0) {
              <div class="goal-plan-card">
                <div class="gp-header">
                  <mat-icon>flag</mat-icon>
                  <span>Prognoza osiągnięcia Twojego celu</span>
                </div>

                <div class="gp-stats-grid">
                  <div class="gp-stat">
                    <span class="gp-label">
                      {{ profileForm.get('goal')?.value === DietGoal.Cut ? 'Do zrzucenia' : 'Do zbudowania' }}
                    </span>
                    <strong class="stat-num">{{ res.weightDifferenceKg }} kg</strong>
                    <span class="stat-route">
                      {{ currentWeight }} kg ➔ {{ res.targetWeightKg }} kg
                    </span>
                  </div>

                  <div class="gp-stat">
                    <span class="gp-label">Tempo tygodniowe</span>
                    <strong class="stat-num">
                      ~{{ profileForm.get('goal')?.value === DietGoal.Cut ? '-' : '+' }}{{ res.weeklyChangeKg ?? '0.5' }} kg
                    </strong>
                    <span class="stat-route">co 7 dni</span>
                  </div>

                  <div class="gp-stat">
                    <span class="gp-label">Szacowany czas</span>
                    <strong class="stat-num">
                      ok. {{ res.estimatedWeeks }} {{ getWeeksLabel(res.estimatedWeeks) }}
                    </strong>
                    <span class="stat-route">
                      {{ getMonthsLabel(res.estimatedWeeks) }}
                    </span>
                  </div>
                </div>

                @if (res.estimatedWeeks) {
                  <div class="gp-target-date">
                    <mat-icon>event_available</mat-icon>
                    <span>
                      Orientacyjny termin osiągnięcia celu: 
                      <strong>{{ getEstimatedDate(res.estimatedWeeks) }}</strong>
                    </span>
                  </div>
                }
              </div>
            }

            <mat-divider></mat-divider>

            <!-- ROZKŁAD MAKROSKŁADNIKÓW -->
            <h4 class="macro-split-title">Rekomendowany rozkład makroskładników:</h4>
            <div class="macro-cards">
              <div class="m-card protein">
                <span class="m-name">Białko</span>
                <strong>{{ res.targetProteinGrams }} g</strong>
                <small>{{ res.targetProteinGrams * 4 }} kcal ({{ pct(res.targetProteinGrams * 4, res.targetCalories) }}%)</small>
              </div>

              <div class="m-card carbs">
                <span class="m-name">Węglowodany</span>
                <strong>{{ res.targetCarbsGrams }} g</strong>
                <small>{{ res.targetCarbsGrams * 4 }} kcal ({{ pct(res.targetCarbsGrams * 4, res.targetCalories) }}%)</small>
              </div>

              <div class="m-card fat">
                <span class="m-name">Tłuszcze</span>
                <strong>{{ res.targetFatGrams }} g</strong>
                <small>{{ res.targetFatGrams * 9 }} kcal ({{ pct(res.targetFatGrams * 9, res.targetCalories) }}%)</small>
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
        line-height: 1.5;
      }

      .guide-header-btn {
        border-radius: 10px;
        font-weight: 600;
        height: 40px;
      }
    }

    .calc-layout {
      display: grid;
      grid-template-columns: 1.25fr 1fr;
      gap: 24px;
      align-items: start;
    }

    @media (max-width: 960px) {
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
      gap: 12px;
    }

    .gender-row {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 4px;

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

    /* Panele konfiguracji celu */
    .goal-config-box {
      border-radius: 14px;
      padding: 18px;
      margin-top: 4px;
      margin-bottom: 8px;
      border: 1px solid;

      &.cut-theme {
        background: #f0fdf4;
        border-color: #bbf7d0;

        .icon-cut {
          color: #16a34a;
        }
      }

      &.bulk-theme {
        background: #eff6ff;
        border-color: #bfdbfe;

        .icon-bulk {
          color: #2563eb;
        }
      }

      &.maintain-theme {
        background: #f8fafc;
        border-color: #e2e8f0;

        .icon-maintain {
          color: #64748b;
        }
      }

      .config-header {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 16px;

        mat-icon {
          font-size: 28px;
          width: 28px;
          height: 28px;
        }

        strong {
          display: block;
          font-size: 15px;
          color: #0f172a;
        }

        span {
          font-size: 12.5px;
          color: #64748b;
        }
      }

      .strength-training-alert {
        background: #ffffff;
        border: 1px solid #bfdbfe;
        border-left: 4px solid #2563eb;
        border-radius: 10px;
        padding: 12px 14px;
        margin-bottom: 14px;

        .alert-icon-title {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #1d4ed8;
          font-size: 13.5px;
          margin-bottom: 4px;

          mat-icon {
            color: #2563eb;
            font-size: 20px;
            width: 20px;
            height: 20px;
          }
        }

        p {
          margin: 0;
          font-size: 12px;
          color: #334155;
          line-height: 1.5;

          strong {
            color: #0f172a;
          }
        }
      }

      .maintain-info {
        margin: 0;
        font-size: 13.5px;
        color: #334155;
        line-height: 1.55;
      }
    }

    .target-weight-input-row {
      margin-bottom: 12px;

      .target-weight-field {
        width: 100%;
      }

      .suffix-text {
        font-weight: 600;
        color: #64748b;
        padding-right: 6px;
      }

      .hint-pill {
        display: inline-block;
        font-weight: 600;
        font-size: 12px;
        padding: 2px 8px;
        border-radius: 6px;
        margin-top: 2px;

        &.hint-green {
          background: #dcfce7;
          color: #15803d;
        }

        &.hint-neutral {
          background: #f1f5f9;
          color: #475569;
        }

        &.hint-amber {
          background: #fef3c7;
          color: #b45309;
        }
      }
    }

    .presets-section {
      .presets-label {
        display: block;
        font-size: 13px;
        font-weight: 600;
        color: #334155;
        margin-bottom: 10px;
      }

      .presets-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
        gap: 10px;

        &.bulk-grid {
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
        }
      }

      .preset-tile {
        position: relative;
        background: #ffffff;
        border: 1.5px solid #cbd5e1;
        border-radius: 12px;
        padding: 12px 10px;
        text-align: left;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        gap: 3px;
        transition: all 0.2s ease;
        outline: none;

        &:hover {
          border-color: #3b82f6;
          background: #f8fafc;
        }

        &.active {
          border-color: #2563eb;
          background: #eff6ff;
          box-shadow: 0 0 0 1.5px #2563eb;

          .tile-title {
            color: #1d4ed8;
          }
          .tile-pct {
            background: #2563eb;
            color: #ffffff;
          }
        }

        &.featured {
          border-color: #93c5fd;

          &.active {
            border-color: #2563eb;
          }
        }

        .tile-badge {
          position: absolute;
          top: -8px;
          right: 8px;
          background: #2563eb;
          color: #ffffff;
          font-size: 10px;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 4px;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .tile-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 6px;
        }

        .tile-title {
          font-size: 13px;
          font-weight: 700;
          color: #1e293b;
        }

        .tile-pct {
          font-size: 11.5px;
          font-weight: 800;
          background: #e2e8f0;
          color: #334155;
          padding: 2px 6px;
          border-radius: 6px;
        }

        .tile-rate {
          font-size: 11.5px;
          font-weight: 600;
          color: #16a34a;
        }

        .tile-desc {
          font-size: 11px;
          color: #64748b;
          line-height: 1.3;
          margin-top: 2px;
        }
      }

      .custom-pct-box {
        margin-top: 12px;

        .custom-field {
          width: 100%;
        }
      }
    }

    .save-btn {
      height: 48px;
      font-size: 15px;
      font-weight: 600;
      border-radius: 10px;
      margin-top: 10px;
    }

    /* Prawa kolumna - Wyniki */
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
        font-size: 11.5px;
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
      margin-bottom: 16px;
      box-shadow: 0 4px 16px rgba(79, 70, 229, 0.25);

      .t-title {
        font-size: 12.5px;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        opacity: 0.9;
        font-weight: 600;
      }

      .t-kcal {
        font-size: 38px;
        font-weight: 800;
        margin: 4px 0;

        span {
          font-size: 16px;
          font-weight: 500;
          opacity: 0.9;
        }
      }

      .t-subtext {
        font-size: 13.5px;
        opacity: 0.95;
        background: rgba(255, 255, 255, 0.15);
        display: inline-block;
        padding: 4px 12px;
        border-radius: 20px;
        margin-top: 4px;

        strong {
          color: #ffffff;
        }
      }
    }

    .bmr-alert {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 12px;
      padding: 12px 14px;
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 16px;
      color: #991b1b;

      mat-icon {
        color: #dc2626;
        font-size: 22px;
        width: 22px;
        height: 22px;
      }

      strong {
        display: block;
        font-size: 13.5px;
        margin-bottom: 2px;
      }

      p {
        margin: 0;
        font-size: 12px;
        line-height: 1.45;
        color: #7f1d1d;
      }
    }

    .goal-plan-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 18px;

      .gp-header {
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 700;
        font-size: 13.5px;
        color: #0f172a;
        margin-bottom: 12px;

        mat-icon {
          color: #2563eb;
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }

      .gp-stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 8px;
        margin-bottom: 12px;
      }

      .gp-stat {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        padding: 8px 10px;
        display: flex;
        flex-direction: column;

        .gp-label {
          font-size: 11px;
          color: #64748b;
          font-weight: 600;
        }

        .stat-num {
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
          margin: 2px 0;
        }

        .stat-route {
          font-size: 10.5px;
          color: #94a3b8;
        }
      }

      .gp-target-date {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 12.5px;
        color: #334155;
        background: #eff6ff;
        padding: 8px 12px;
        border-radius: 8px;

        mat-icon {
          color: #2563eb;
          font-size: 18px;
          width: 18px;
          height: 18px;
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

  // Preset deficytu: 10, 15, 20, 25 lub -1 (własny)
  readonly selectedDeficitPreset = signal<number>(15);
  readonly isCustomDeficit = computed(() => this.selectedDeficitPreset() === -1);

  readonly profileForm = this.fb.nonNullable.group({
    gender: [Gender.Male, [Validators.required]],
    age: [25, [Validators.required, Validators.min(12), Validators.max(120)]],
    weightKg: [75, [Validators.required, Validators.min(30), Validators.max(300)]],
    heightCm: [178, [Validators.required, Validators.min(100), Validators.max(250)]],
    activityLevel: [ActivityLevel.ModeratelyActive, [Validators.required]],
    goal: [DietGoal.Cut, [Validators.required]],
    targetWeightKg: [null as number | null],
    deficitPercentage: [15 as number | null]
  });

  get currentWeight(): number {
    return this.profileForm.get('weightKg')?.value ?? 75;
  }

  ngOnInit(): void {
    // Reaktywne odpytywanie API z debouncem przy zmianach w formularzu
    this.profileForm.valueChanges
      .pipe(debounceTime(250))
      .subscribe(() => this.recalculatePreview());

    this.recalculatePreview();

    this.api.getProfile().subscribe({
      next: (profile) => {
        const pct = profile.deficitPercentage ?? (profile.goal === DietGoal.Bulk ? 10 : 15);
        if ([10, 15, 20, 25].includes(pct)) {
          this.selectedDeficitPreset.set(pct);
        } else {
          this.selectedDeficitPreset.set(-1);
        }

        this.profileForm.patchValue({
          gender: profile.gender,
          age: profile.age,
          weightKg: profile.weightKg,
          heightCm: profile.heightCm,
          activityLevel: profile.activityLevel,
          goal: profile.goal,
          targetWeightKg: profile.targetWeightKg ?? null,
          deficitPercentage: profile.goal === DietGoal.Maintain ? null : pct
        });
        this.recalculatePreview();
      }
    });
  }

  onGoalSelect(goal: DietGoal): void {
    if (goal === DietGoal.Cut) {
      this.setDeficit(15);
    } else if (goal === DietGoal.Bulk) {
      this.setDeficit(10);
    } else {
      this.profileForm.patchValue({ deficitPercentage: null });
      this.recalculatePreview();
    }
  }

  setDeficit(pct: number): void {
    this.selectedDeficitPreset.set(pct);
    this.profileForm.patchValue({ deficitPercentage: pct });
    this.recalculatePreview();
  }

  setCustomDeficit(): void {
    this.selectedDeficitPreset.set(-1);
    const curr = this.profileForm.get('deficitPercentage')?.value;
    if (!curr || [10, 15, 20, 25].includes(curr)) {
      this.profileForm.patchValue({ deficitPercentage: 15 });
    }
    this.recalculatePreview();
  }

  recalculatePreview(): void {
    if (this.profileForm.invalid) return;

    const val = this.profileForm.getRawValue();
    this.api.previewCalculation({
      age: val.age,
      gender: val.gender,
      weightKg: val.weightKg,
      heightCm: val.heightCm,
      activityLevel: val.activityLevel,
      goal: val.goal,
      targetWeightKg: val.targetWeightKg,
      deficitPercentage: val.goal === DietGoal.Maintain ? null : val.deficitPercentage
    }).subscribe({
      next: (result) => this.preview.set(result),
      error: () => {}
    });
  }

  onSave(): void {
    if (this.profileForm.invalid) return;
    this.isSaving.set(true);

    const val = this.profileForm.getRawValue();
    this.api.calculateAndSaveProfile({
      age: val.age,
      gender: val.gender,
      weightKg: val.weightKg,
      heightCm: val.heightCm,
      activityLevel: val.activityLevel,
      goal: val.goal,
      targetWeightKg: val.targetWeightKg,
      deficitPercentage: val.goal === DietGoal.Maintain ? null : val.deficitPercentage
    }).subscribe({
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


  getWeeksLabel(weeks: number | null | undefined): string {
    if (!weeks) return 'tygodni';
    if (weeks === 1) return 'tydzień';
    if (weeks >= 2 && weeks <= 4) return 'tygodnie';
    return 'tygodni';
  }

  getMonthsLabel(weeks: number | null | undefined): string {
    if (!weeks) return '';
    const months = Math.round((weeks / 4.33) * 10) / 10;
    if (months < 1) return 'mniej niż 1 miesiąc';
    return `ok. ${months} mies.`;
  }

  getEstimatedDate(weeks: number | null | undefined): string {
    if (!weeks) return '';
    const date = new Date();
    date.setDate(date.getDate() + weeks * 7);
    return date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  pct(part: number, total: number): number {
    if (!total || total <= 0) return 0;
    return Math.round((part / total) * 100);
  }
}
