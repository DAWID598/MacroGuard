import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  AiCoachReportDto,
  LogWeightRequest,
  WeeklyWeightStatDto,
  WeightEntryDto,
  WeightStatsSummaryDto
} from '../../core/models/api.models';
import { MacroApiService } from '../../core/services/macro-api.service';
import { ReportDialogComponent } from '../diary/report-dialog.component';

interface ChartPoint {
  x: number;
  y: number;
  date: string;
  weight: number;
  note?: string | null;
}

interface YTick {
  y: number;
  value: number;
}

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule
  ],
  template: `
    <div class="stats-container">
      <!-- Nagłówek i Edukacyjna Wskazówka -->
      <div class="stats-header">
        <div class="header-titles">
          <h1>
            <mat-icon class="title-icon">show_chart</mat-icon>
            Waga & Postępy
          </h1>
          <p class="subtitle">
            Śledź wagę bez obsesji. Wahania z dnia na dzień to głównie woda i sód — patrz na średnie tygodniowe!
          </p>
        </div>

        <div class="stats-header-actions">
          <button mat-stroked-button class="report-btn" (click)="openReportDialog()" matTooltip="Raport okresowy i wydruk do PDF">
            <mat-icon>picture_as_pdf</mat-icon>
            Raport PDF
          </button>
        </div>
      </div>

      <div class="tip-banner">
        <mat-icon class="tip-icon">lightbulb</mat-icon>
        <div class="tip-content">
          <strong>Złota zasada ważenia:</strong> Waż się rano, na czczo, po toalecie i bez ubrań. 
          Jednego dnia zjesz więcej soli i waga skoczy o 1.5 kg wody — to normalne! Realny postęp widać w 
          <em>Średniej Tygodniowej</em>.
        </div>
      </div>

      <!-- Szybki Zapis Wagi + Metryki KPI -->
      <div class="top-dashboard-grid">
        <!-- Karta Rejestracji Wagi -->
        <mat-card class="log-card">
          <mat-card-header>
            <mat-icon mat-card-avatar color="primary">scale</mat-icon>
            <mat-card-title>Zapisz Poranną Wagę</mat-card-title>
            <mat-card-subtitle>Wpisz lub wyreguluj przyciskami</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content class="log-card-content">
            <div class="date-picker-row">
              <mat-form-field appearance="outline" class="dense-field full-width">
                <mat-label>Data pomiaru</mat-label>
                <input matInput type="date" [(ngModel)]="logForm.date" (change)="onDateChange()" />
              </mat-form-field>
            </div>

            <!-- Kontrolka regulacji wagi z przyciskami +/- -->
            <div class="weight-stepper-control">
              <button 
                mat-mini-fab 
                color="basic" 
                class="step-btn" 
                (click)="adjustWeight(-0.5)" 
                matTooltip="-0.5 kg"
                type="button">
                -0.5
              </button>
              <button 
                mat-mini-fab 
                color="primary" 
                class="step-btn" 
                (click)="adjustWeight(-0.1)" 
                matTooltip="-0.1 kg"
                type="button">
                -0.1
              </button>

              <div class="weight-display-box">
                <input 
                  type="number" 
                  step="0.1" 
                  min="20" 
                  max="400" 
                  [(ngModel)]="logForm.weightKg" 
                  class="weight-big-input" 
                />
                <span class="unit">kg</span>
              </div>

              <button 
                mat-mini-fab 
                color="primary" 
                class="step-btn" 
                (click)="adjustWeight(0.1)" 
                matTooltip="+0.1 kg"
                type="button">
                +0.1
              </button>
              <button 
                mat-mini-fab 
                color="basic" 
                class="step-btn" 
                (click)="adjustWeight(0.5)" 
                matTooltip="+0.5 kg"
                type="button">
                +0.5
              </button>
            </div>

            <!-- Opcjonalna notatka -->
            <mat-form-field appearance="outline" class="dense-field full-width note-field">
              <mat-label>Notatka (opcjonalnie)</mat-label>
              <input 
                matInput 
                [(ngModel)]="logForm.note" 
                placeholder="np. na czczo, po cheat mealu, po treningu" 
                maxlength="100" 
              />
            </mat-form-field>

            <button 
              mat-flat-button 
              color="primary" 
              class="save-weight-btn" 
              (click)="saveWeight()" 
              [disabled]="isSaving || !logForm.weightKg">
              @if (isSaving) {
                <mat-spinner diameter="20"></mat-spinner>
              } @else {
                <ng-container>
                  <mat-icon>{{ hasEntryForDate(logForm.date) ? 'edit' : 'check' }}</mat-icon>
                  <span>{{ hasEntryForDate(logForm.date) ? 'Zaktualizuj pomiar' : 'Zapisz pomiar' }}</span>
                </ng-container>
              }
            </button>
          </mat-card-content>
        </mat-card>

        <!-- KPI Metryki (4 kafelki) -->
        <div class="kpi-grid">
          <!-- Karta 1: Ostatnia Waga -->
          <mat-card class="kpi-card">
            <div class="kpi-icon-box blue">
              <mat-icon>monitor_weight</mat-icon>
            </div>
            <div class="kpi-details">
              <span class="kpi-label">Ostatnia Waga</span>
              <div class="kpi-value-row">
                <span class="kpi-number">{{ stats?.currentWeightKg ? (stats?.currentWeightKg | number:'1.1-2') : '--' }}</span>
                <span class="kpi-unit">kg</span>
              </div>
              <span class="kpi-subtext">
                {{ stats?.lastRecordedDate ? (stats?.lastRecordedDate | date:'d MMMM yyyy') : 'Brak pomiarów' }}
              </span>
            </div>
          </mat-card>

          <!-- Karta 2: Całkowity Postęp -->
          <mat-card class="kpi-card">
            <div class="kpi-icon-box" [ngClass]="(stats?.totalChangeKg ?? 0) <= 0 ? 'green' : 'amber'">
              <mat-icon>{{ (stats?.totalChangeKg ?? 0) <= 0 ? 'trending_down' : 'trending_up' }}</mat-icon>
            </div>
            <div class="kpi-details">
              <span class="kpi-label">Całkowity Postęp</span>
              <div class="kpi-value-row">
                <span class="kpi-number" [ngClass]="(stats?.totalChangeKg ?? 0) <= 0 ? 'text-green' : 'text-amber'">
                  {{ (stats?.totalChangeKg ?? 0) > 0 ? '+' : '' }}{{ stats?.totalChangeKg ? (stats?.totalChangeKg | number:'1.1-2') : '0.0' }}
                </span>
                <span class="kpi-unit">kg</span>
              </div>
              <span class="kpi-subtext">
                od startu ({{ stats?.startingWeightKg ? (stats?.startingWeightKg | number:'1.1-1') + ' kg' : '--' }})
              </span>
            </div>
          </mat-card>

          <!-- Karta 3: Średnia w tym tygodniu -->
          <mat-card class="kpi-card">
            <div class="kpi-icon-box purple">
              <mat-icon>date_range</mat-icon>
            </div>
            <div class="kpi-details">
              <span class="kpi-label">Średnia w tym tygodniu</span>
              <div class="kpi-value-row">
                <span class="kpi-number">{{ stats?.averageThisWeekKg ? (stats?.averageThisWeekKg | number:'1.1-2') : '--' }}</span>
                <span class="kpi-unit">kg</span>
              </div>
              <span class="kpi-subtext">
                Poprzedni tydzień: {{ stats?.averageLastWeekKg ? (stats?.averageLastWeekKg | number:'1.1-2') + ' kg' : 'brak danych' }}
              </span>
            </div>
          </mat-card>

          <!-- Karta 4: Zmiana Tydzień do Tygodnia -->
          <mat-card class="kpi-card">
            <div class="kpi-icon-box" [ngClass]="(stats?.weeklyChangeKg ?? 0) <= 0 ? 'green' : 'amber'">
              <mat-icon>{{ (stats?.weeklyChangeKg ?? 0) <= 0 ? 'speed' : 'priority_high' }}</mat-icon>
            </div>
            <div class="kpi-details">
              <span class="kpi-label">Tydzień do Tygodnia</span>
              <div class="kpi-value-row">
                <span class="kpi-number" [ngClass]="(stats?.weeklyChangeKg ?? 0) <= 0 ? 'text-green' : 'text-amber'">
                  {{ (stats?.weeklyChangeKg ?? 0) > 0 ? '+' : '' }}{{ stats?.weeklyChangeKg ? (stats?.weeklyChangeKg | number:'1.1-2') : '0.0' }}
                </span>
                <span class="kpi-unit">kg / tydz.</span>
              </div>
              <span class="kpi-subtext">
                {{ getWeeklyVerdict(stats?.weeklyChangeKg) }}
              </span>
            </div>
          </mat-card>
        </div>
      </div>

      <!-- KARTA AI COACH -->
      <mat-card class="coach-card">
        <div class="coach-header">
          <div class="coach-header-left">
            <div class="coach-avatar">
              <mat-icon>psychology</mat-icon>
            </div>
            <div>
              <h2 class="coach-title">
                MacroGuard AI Coach
                <span class="ai-pill">Inteligentny Asystent</span>
              </h2>
              <span class="coach-subtitle">
                Analiza Twojego bilansu kalorii, spożycia białka i trendu wagi
              </span>
            </div>
          </div>

          <div class="coach-actions">
            <div class="coach-range-selector">
              <button 
                mat-stroked-button 
                [class.active-range]="coachDays === 7" 
                (click)="setCoachDays(7)">
                7 dni
              </button>
              <button 
                mat-stroked-button 
                [class.active-range]="coachDays === 30" 
                (click)="setCoachDays(30)">
                30 dni
              </button>
            </div>

            <button 
              mat-flat-button 
              class="ask-coach-btn" 
              [disabled]="isGeneratingCoach" 
              (click)="generateCoachReport()">
              @if (isGeneratingCoach) {
                <mat-spinner diameter="18"></mat-spinner>
                <span>Analizowanie...</span>
              } @else {
                <ng-container>
                  <mat-icon>auto_awesome</mat-icon>
                  <span>Zapytaj AI o podsumowanie</span>
                </ng-container>
              }
            </button>
          </div>
        </div>

        <mat-card-content class="coach-card-content">
          @if (coachReport) {
            <div class="coach-report-box">
              <div class="rep-headline-row">
                <h3 class="rep-headline">{{ coachReport.headline }}</h3>
                <span class="model-badge">
                  <mat-icon class="model-badge-icon">memory</mat-icon>
                  {{ coachReport.aiModelUsed }}
                </span>
              </div>

              <p class="rep-summary">{{ coachReport.summary }}</p>

              <div class="coach-analysis-grid">
                <div class="analysis-card">
                  <div class="card-icon-title">
                    <mat-icon color="primary">local_fire_department</mat-icon>
                    <strong>Bilans Kaloryczny</strong>
                  </div>
                  <p>{{ coachReport.calorieAnalysis }}</p>
                  <div class="mini-stat">
                    Średnio: <strong>{{ coachReport.avgCalories | number:'1.0-0' }} kcal</strong> / cel {{ coachReport.targetCalories }} kcal
                  </div>
                </div>

                <div class="analysis-card">
                  <div class="card-icon-title">
                    <mat-icon color="accent">fitness_center</mat-icon>
                    <strong>Makroskładniki & Białko</strong>
                  </div>
                  <p>{{ coachReport.macroAnalysis }}</p>
                  <div class="mini-stat">
                    Białko: <strong>{{ coachReport.avgProteinGrams | number:'1.0-1' }} g</strong> / cel {{ coachReport.targetProteinGrams }} g
                  </div>
                </div>

                <div class="analysis-card">
                  <div class="card-icon-title">
                    <mat-icon color="primary">scale</mat-icon>
                    <strong>Trend Wagi</strong>
                  </div>
                  <p>{{ coachReport.weightTrendAnalysis }}</p>
                  <div class="mini-stat">
                    Zmiana w okresie: <strong>{{ (coachReport.weightChangeKg ?? 0) > 0 ? '+' : '' }}{{ coachReport.weightChangeKg ? (coachReport.weightChangeKg | number:'1.1-2') + ' kg' : 'brak danych' }}</strong>
                  </div>
                </div>
              </div>

              <div class="recommendations-box">
                <h4>
                  <mat-icon>lightbulb</mat-icon>
                  Konkretne wskazówki trenera:
                </h4>
                <ul>
                  @for (rec of coachReport.recommendations; track rec) {
                    <li>{{ rec }}</li>
                  }
                </ul>
              </div>
            </div>
          } @else if (!isGeneratingCoach) {
            <div class="coach-placeholder">
              <mat-icon class="placeholder-icon">tips_and_updates</mat-icon>
              <div>
                <strong>Chcesz wiedzieć, czy tempo Twojej redukcji jest optymalne?</strong>
                <p>Kliknij przycisk „Zapytaj AI o podsumowanie”, a asystent sprawdzi Twój bilans kaloryczny, sytość z białka i zachowanie wagi, generując konkretne wskazówki.</p>
              </div>
            </div>
          }
        </mat-card-content>
      </mat-card>

      <!-- Interaktywny Wykres Liniowy Trendu SVG -->
      <mat-card class="chart-card">
        <mat-card-header class="chart-header">
          <div>
            <mat-card-title>Trend Wagi w Czasie</mat-card-title>
            <mat-card-subtitle>Punkty dzienne oraz linia trendu</mat-card-subtitle>
          </div>
          <!-- Filtry zakresu dni -->
          <div class="range-filters">
            <button 
              mat-stroked-button 
              [color]="selectedRangeDays === 14 ? 'primary' : 'basic'"
              [class.active-range]="selectedRangeDays === 14"
              (click)="selectRange(14)">
              14 dni
            </button>
            <button 
              mat-stroked-button 
              [color]="selectedRangeDays === 30 ? 'primary' : 'basic'"
              [class.active-range]="selectedRangeDays === 30"
              (click)="selectRange(30)">
              30 dni
            </button>
            <button 
              mat-stroked-button 
              [color]="selectedRangeDays === 90 ? 'primary' : 'basic'"
              [class.active-range]="selectedRangeDays === 90"
              (click)="selectRange(90)">
              90 dni
            </button>
            <button 
              mat-stroked-button 
              [color]="selectedRangeDays === 0 ? 'primary' : 'basic'"
              [class.active-range]="selectedRangeDays === 0"
              (click)="selectRange(0)">
              Wszystko
            </button>
          </div>
        </mat-card-header>

        <mat-card-content>
          @if (isLoading) {
            <div class="loading-state">
              <mat-spinner diameter="40"></mat-spinner>
              <span>Ładowanie statystyk wagi...</span>
            </div>
          } @else if (chartPoints.length === 0) {
            <div class="empty-state">
              <mat-icon class="empty-icon">show_chart</mat-icon>
              <h3>Brak pomiarów w wybranym okresie</h3>
              <p>Zapisz swój dzisiejszy pomiar wagi w formularzu powyżej, aby zobaczyć wykres trendu!</p>
            </div>
          } @else {
            <div class="svg-chart-container">
              <svg viewBox="0 0 800 320" class="weight-svg-chart">
                <defs>
                  <!-- Gradient pod wykresem -->
                  <linearGradient id="weightAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.32"/>
                    <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.01"/>
                  </linearGradient>
                  <!-- Gradient linii -->
                  <linearGradient id="weightLineGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stop-color="#3b82f6"/>
                    <stop offset="100%" stop-color="#2563eb"/>
                  </linearGradient>
                </defs>

                <!-- Siatka pozioma i etykiety osi Y -->
                @for (tick of yTicks; track tick.value) {
                  <line 
                    x1="55" 
                    [attr.y1]="tick.y" 
                    x2="780" 
                    [attr.y2]="tick.y" 
                    class="grid-line" 
                  />
                  <text 
                    x="48" 
                    [attr.y]="tick.y + 4" 
                    class="axis-text y-text">
                    {{ tick.value | number:'1.1-1' }}
                  </text>
                }

                <!-- Obszar pod wykresem (Area fill) -->
                @if (chartAreaPath) {
                  <path [attr.d]="chartAreaPath" fill="url(#weightAreaGradient)" />
                }

                <!-- Główna linia trendu -->
                <path 
                  [attr.d]="chartLinePath" 
                  fill="none" 
                  stroke="url(#weightLineGradient)" 
                  stroke-width="3" 
                  stroke-linecap="round" 
                  stroke-linejoin="round" 
                />

                <!-- Punkty pomiarów -->
                @for (pt of chartPoints; track pt.date) {
                  <g class="chart-point-group">
                    <circle 
                      [attr.cx]="pt.x" 
                      [attr.cy]="pt.y" 
                      r="5.5" 
                      class="point-circle" 
                    />
                    <circle 
                      [attr.cx]="pt.x" 
                      [attr.cy]="pt.y" 
                      r="12" 
                      class="point-hitbox"
                      [matTooltip]="formatPointTooltip(pt)" 
                    />
                  </g>
                }

                <!-- Etykiety dat na dole (Oś X) -->
                @for (label of xLabels; track label.text + label.x) {
                  <text 
                    [attr.x]="label.x" 
                    y="310" 
                    class="axis-text x-text">
                    {{ label.text }}
                  </text>
                }
              </svg>
            </div>
          }
        </mat-card-content>
      </mat-card>

      <!-- Sekcja 2 kolumn: Średnie Tygodniowe i Ostatnie Pomiary -->
      <div class="bottom-tables-grid">
        <!-- Średnie Tygodniowe (Kluczowy wskaźnik redukcji/masy) -->
        <mat-card class="table-card">
          <mat-card-header>
            <mat-icon mat-card-avatar color="primary">date_range</mat-icon>
            <mat-card-title>Podsumowanie Średnich Tygodniowych</mat-card-title>
            <mat-card-subtitle>Najbardziej wiarygodny wskaźnik rzeczywistego postępu</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            @if (!stats?.weeklyStats?.length) {
              <div class="empty-table-msg">Brak danych tygodniowych. Kontynuuj ważenie!</div>
            } @else {
              <div class="table-scroll">
                <table class="styled-table">
                  <thead>
                    <tr>
                      <th>Tydzień</th>
                      <th>Zakres dat</th>
                      <th>Średnia</th>
                      <th>Zmiana</th>
                      <th>Pomiary</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (w of stats?.weeklyStats; track w.year + '-' + w.weekNumber) {
                      <tr>
                        <td>
                          <strong>Tydz. {{ w.weekNumber }}</strong>
                        </td>
                        <td class="date-range-cell">
                          {{ w.startDate | date:'dd.MM' }} - {{ w.endDate | date:'dd.MM' }}
                        </td>
                        <td>
                          <span class="weight-badge">{{ w.averageWeightKg | number:'1.1-2' }} kg</span>
                        </td>
                        <td>
                          @if (w.changeFromPreviousWeekKg !== null && w.changeFromPreviousWeekKg !== undefined) {
                            <span 
                              class="diff-badge" 
                              [ngClass]="w.changeFromPreviousWeekKg <= 0 ? 'diff-negative' : 'diff-positive'">
                              <mat-icon class="inline-icon">
                                {{ w.changeFromPreviousWeekKg <= 0 ? 'arrow_downward' : 'arrow_upward' }}
                              </mat-icon>
                              {{ w.changeFromPreviousWeekKg > 0 ? '+' : '' }}{{ w.changeFromPreviousWeekKg | number:'1.1-2' }} kg
                            </span>
                          } @else {
                            <span class="diff-first">Start</span>
                          }
                        </td>
                        <td>
                          <span class="count-badge" [class.count-good]="w.entriesCount >= 4">
                            {{ w.entriesCount }}/7 dni
                          </span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </mat-card-content>
        </mat-card>

        <!-- Ostatnie Pomiary Dzienne z Opcją Usunięcia -->
        <mat-card class="table-card">
          <mat-card-header>
            <mat-icon mat-card-avatar color="primary">history</mat-icon>
            <mat-card-title>Historia Ostatnich Pomiarów</mat-card-title>
            <mat-card-subtitle>Ostatnie 30 wpisów dziennych</mat-card-subtitle>
          </mat-card-header>

          <mat-card-content>
            @if (!stats?.recentEntries?.length) {
              <div class="empty-table-msg">Brak zarejestrowanych pomiarów wagi.</div>
            } @else {
              <div class="table-scroll">
                <table class="styled-table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Waga</th>
                      <th>Notatka</th>
                      <th class="text-right">Akcja</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (entry of stats?.recentEntries; track entry.id) {
                      <tr>
                        <td>
                          <span class="font-medium">{{ entry.date | date:'dd.MM.yyyy' }}</span>
                          @if (entry.date === todayString) {
                            <span class="today-tag">Dziś</span>
                          }
                        </td>
                        <td>
                          <strong>{{ entry.weightKg | number:'1.1-2' }} kg</strong>
                        </td>
                        <td class="note-cell">
                          {{ entry.note || '—' }}
                        </td>
                        <td class="text-right">
                          <button 
                            mat-icon-button 
                            color="warn" 
                            (click)="deleteEntry(entry)" 
                            matTooltip="Usuń ten wpis">
                            <mat-icon>delete_outline</mat-icon>
                          </button>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .stats-container {
      max-width: 1180px;
      margin: 24px auto;
      padding: 0 16px 48px;
    }

    .stats-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      h1 {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 26px;
        font-weight: 700;
        margin: 0 0 6px 0;
        color: #0f172a;

        .title-icon {
          color: #2563eb;
          font-size: 30px;
          width: 30px;
          height: 30px;
        }
      }

      .subtitle {
        color: #64748b;
        margin: 0;
        font-size: 15px;
      }
    }

    .stats-header-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .report-btn {
      background: #ffffff !important;
      color: #0f172a !important;
      border-color: #cbd5e1 !important;
      font-weight: 600;
      border-radius: 12px;
      padding: 0 14px;
      height: 40px;

      mat-icon {
        color: #ef4444;
        margin-right: 6px;
      }

      &:hover {
        background: #f8fafc !important;
      }
    }

    /* KARTA AI COACH */
    .coach-card {
      border-radius: 16px;
      border: 1px solid #c7d2fe;
      background: linear-gradient(180deg, #ffffff 0%, #f8faff 100%);
      box-shadow: 0 4px 18px rgba(99, 102, 241, 0.08);
      margin-bottom: 24px;
      overflow: hidden;
    }

    .coach-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 22px;
      border-bottom: 1px solid #e0e7ff;
      flex-wrap: wrap;
      gap: 16px;

      .coach-header-left {
        display: flex;
        align-items: center;
        gap: 14px;

        .coach-avatar {
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;

          mat-icon {
            font-size: 26px;
            width: 26px;
            height: 26px;
          }
        }

        .coach-title {
          font-size: 18px;
          font-weight: 800;
          color: #1e1b4b;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;

          .ai-pill {
            font-size: 11px;
            padding: 2px 7px;
            border-radius: 10px;
            background: #e0e7ff;
            color: #4338ca;
            font-weight: 700;
            text-transform: uppercase;
          }
        }

        .coach-subtitle {
          font-size: 13px;
          color: #64748b;
        }
      }

      .coach-actions {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .coach-range-selector {
        display: flex;
        gap: 4px;

        button {
          font-size: 12px;
          height: 34px;
          border-radius: 8px;

          &.active-range {
            background: #e0e7ff;
            color: #4338ca;
            border-color: #a5b4fc;
            font-weight: 700;
          }
        }
      }

      .ask-coach-btn {
        background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%) !important;
        color: #ffffff !important;
        border-radius: 10px;
        font-weight: 600;
        height: 38px;
        display: flex;
        align-items: center;
        gap: 6px;
      }
    }

    .coach-card-content {
      padding: 20px 22px;
    }

    .coach-placeholder {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px 20px;
      background: #eff6ff;
      border: 1px dashed #bfdbfe;
      border-radius: 12px;
      color: #1e3a8a;

      .placeholder-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
        color: #3b82f6;
        flex-shrink: 0;
      }

      strong {
        display: block;
        font-size: 14.5px;
        margin-bottom: 2px;
      }

      p {
        margin: 0;
        font-size: 13.5px;
        color: #1d4ed8;
      }
    }

    .coach-report-box {
      display: flex;
      flex-direction: column;
      gap: 18px;

      .rep-headline-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;

        .rep-headline {
          font-size: 18px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }

        .model-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #f1f5f9;
          border: 1px solid #cbd5e1;
          color: #475569;
          padding: 3px 9px;
          border-radius: 12px;
          font-size: 11.5px;
          font-weight: 600;

          .model-badge-icon {
            font-size: 15px;
            width: 15px;
            height: 15px;
          }
        }
      }

      .rep-summary {
        font-size: 14.5px;
        color: #334155;
        line-height: 1.6;
        margin: 0;
        background: #f8fafc;
        padding: 14px 16px;
        border-radius: 10px;
        border-left: 4px solid #4f46e5;
      }
    }

    .coach-analysis-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 14px;

      .analysis-card {
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 14px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        gap: 10px;

        .card-icon-title {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 14px;
          color: #0f172a;

          mat-icon {
            font-size: 20px;
            width: 20px;
            height: 20px;
          }
        }

        p {
          font-size: 13px;
          color: #475569;
          line-height: 1.5;
          margin: 0;
        }

        .mini-stat {
          font-size: 12px;
          color: #64748b;
          border-top: 1px solid #f1f5f9;
          padding-top: 8px;

          strong {
            color: #0f172a;
          }
        }
      }
    }

    .recommendations-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 12px;
      padding: 16px 20px;

      h4 {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: 700;
        color: #166534;
        margin: 0 0 10px;

        mat-icon {
          color: #16a34a;
          font-size: 20px;
          width: 20px;
          height: 20px;
        }
      }

      ul {
        margin: 0;
        padding-left: 20px;
        color: #166534;
        font-size: 13.5px;
        line-height: 1.6;

        li {
          margin-bottom: 4px;
        }
      }
    }

    .tip-banner {
      display: flex;
      align-items: center;
      gap: 14px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 12px;
      padding: 14px 18px;
      margin-bottom: 24px;
      color: #1e3a8a;
      font-size: 14px;
      line-height: 1.5;

      .tip-icon {
        color: #2563eb;
        font-size: 26px;
        width: 26px;
        height: 26px;
        flex-shrink: 0;
      }

      strong {
        color: #1d4ed8;
      }
    }

    /* Górny panel: Zapis wagi + 4 karty KPI */
    .top-dashboard-grid {
      display: grid;
      grid-template-columns: 360px 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }

    .log-card {
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
    }

    .log-card-content {
      padding-top: 14px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .full-width {
      width: 100%;
    }

    .weight-stepper-control {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px;

      .step-btn {
        box-shadow: none;
      }

      .weight-display-box {
        display: flex;
        align-items: baseline;
        justify-content: center;
        gap: 4px;
        min-width: 110px;

        .weight-big-input {
          width: 90px;
          font-size: 28px;
          font-weight: 800;
          color: #0f172a;
          text-align: center;
          border: none;
          background: transparent;
          outline: none;
          font-family: inherit;

          &::-webkit-inner-spin-button,
          &::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
          }
        }

        .unit {
          font-size: 16px;
          font-weight: 600;
          color: #64748b;
        }
      }
    }

    .save-weight-btn {
      height: 44px;
      font-size: 15px;
      font-weight: 600;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    /* Grid 4 kafelków KPI */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }

    .kpi-card {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 16px;
      padding: 18px 20px;
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);

      .kpi-icon-box {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        &.blue { background: #dbeafe; color: #2563eb; }
        &.green { background: #dcfce7; color: #16a34a; }
        &.purple { background: #f3e8ff; color: #9333ea; }
        &.amber { background: #fef3c7; color: #d97706; }
      }

      .kpi-details {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .kpi-label {
        font-size: 13px;
        font-weight: 600;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .kpi-value-row {
        display: flex;
        align-items: baseline;
        gap: 4px;

        .kpi-number {
          font-size: 26px;
          font-weight: 800;
          color: #0f172a;
          line-height: 1.1;

          &.text-green { color: #16a34a; }
          &.text-amber { color: #d97706; }
        }

        .kpi-unit {
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
        }
      }

      .kpi-subtext {
        font-size: 12px;
        color: #94a3b8;
      }
    }

    /* Karta Wykresu SVG */
    .chart-card {
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      margin-bottom: 24px;
      background: #ffffff;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);

      .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-bottom: 8px;
        border-bottom: 1px solid #f1f5f9;
      }

      .range-filters {
        display: flex;
        gap: 6px;

        button {
          font-size: 12.5px;
          border-radius: 20px;
          height: 32px;
          line-height: 32px;
          padding: 0 12px;

          &.active-range {
            background: #2563eb;
            color: #ffffff;
            border-color: #2563eb;
          }
        }
      }
    }

    .svg-chart-container {
      width: 100%;
      height: 320px;
      margin: 16px 0 8px;
    }

    .weight-svg-chart {
      width: 100%;
      height: 100%;
      overflow: visible;

      .grid-line {
        stroke: #e2e8f0;
        stroke-dasharray: 4 4;
        stroke-width: 1;
      }

      .axis-text {
        font-size: 11px;
        fill: #64748b;
        font-family: inherit;
      }

      .y-text {
        text-anchor: end;
      }

      .x-text {
        text-anchor: middle;
      }

      .point-circle {
        fill: #ffffff;
        stroke: #2563eb;
        stroke-width: 3;
        transition: transform 0.15s ease, r 0.15s ease;
      }

      .point-hitbox {
        fill: transparent;
        cursor: pointer;

        &:hover + .point-circle,
        &:hover ~ .point-circle {
          r: 8;
        }
      }

      .chart-point-group:hover .point-circle {
        r: 8;
        fill: #2563eb;
        stroke: #ffffff;
      }
    }

    .loading-state, .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 48px 16px;
      text-align: center;
      color: #64748b;
      gap: 12px;

      .empty-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: #94a3b8;
      }

      h3 {
        margin: 0;
        color: #1e293b;
      }

      p {
        margin: 0;
        max-width: 420px;
      }
    }

    /* Dolne Tabele: Średnie Tygodniowe i Historia */
    .bottom-tables-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }

    .table-card {
      border-radius: 14px;
      border: 1px solid #e2e8f0;
      background: #ffffff;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
    }

    .table-scroll {
      overflow-x: auto;
      max-height: 420px;
    }

    .styled-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13.5px;

      th {
        text-align: left;
        padding: 10px 12px;
        color: #64748b;
        font-weight: 600;
        border-bottom: 2px solid #f1f5f9;
        background: #f8fafc;
        position: sticky;
        top: 0;
        z-index: 2;
      }

      td {
        padding: 12px;
        border-bottom: 1px solid #f1f5f9;
        color: #1e293b;
      }

      tr:hover td {
        background: #f8fafc;
      }

      .text-right {
        text-align: right;
      }

      .weight-badge {
        font-weight: 700;
        color: #0f172a;
      }

      .diff-badge {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        padding: 3px 8px;
        border-radius: 6px;
        font-weight: 600;
        font-size: 12px;

        .inline-icon {
          font-size: 14px;
          width: 14px;
          height: 14px;
        }

        &.diff-negative {
          background: #dcfce7;
          color: #15803d;
        }

        &.diff-positive {
          background: #fef3c7;
          color: #b45309;
        }
      }

      .diff-first {
        font-size: 12px;
        color: #94a3b8;
        font-style: italic;
      }

      .count-badge {
        display: inline-block;
        padding: 2px 7px;
        border-radius: 4px;
        background: #f1f5f9;
        color: #64748b;
        font-size: 11.5px;
        font-weight: 600;

        &.count-good {
          background: #dbeafe;
          color: #1d4ed8;
        }
      }

      .today-tag {
        margin-left: 6px;
        padding: 2px 6px;
        background: #2563eb;
        color: #ffffff;
        border-radius: 4px;
        font-size: 10.5px;
        font-weight: 700;
      }

      .note-cell {
        max-width: 150px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: #64748b;
      }
    }

    .empty-table-msg {
      padding: 32px 16px;
      text-align: center;
      color: #94a3b8;
      font-size: 14px;
    }

    @media (max-width: 960px) {
      .top-dashboard-grid {
        grid-template-columns: 1fr;
      }

      .bottom-tables-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 600px) {
      .kpi-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class StatsComponent implements OnInit {
  private readonly api = inject(MacroApiService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  readonly todayString = new Date().toISOString().split('T')[0];

  stats: WeightStatsSummaryDto | null = null;
  historyEntries: WeightEntryDto[] = [];
  selectedRangeDays: number = 30; // 14, 30, 90, 0 (wszystko)
  isLoading = true;
  isSaving = false;

  // AI Coach
  coachReport: AiCoachReportDto | null = null;
  isGeneratingCoach = false;
  coachDays: number = 7;

  setCoachDays(days: number): void {
    this.coachDays = days;
  }

  generateCoachReport(): void {
    this.isGeneratingCoach = true;
    this.api.getAiCoachReport(this.coachDays).subscribe({
      next: (rep) => {
        this.coachReport = rep;
        this.isGeneratingCoach = false;
        this.snackBar.open('Wygenerowano analizę AI Coach!', 'Świetnie', { duration: 3000 });
      },
      error: (err) => {
        this.isGeneratingCoach = false;
        this.snackBar.open(err.error?.message || 'Błąd podczas generowania analizy AI Coach.', 'Zamknij', { duration: 3000 });
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

  // Formularz wprowadzania wagi
  logForm: LogWeightRequest = {
    date: this.todayString,
    weightKg: 78.0,
    note: ''
  };

  // SVG Chart data
  chartPoints: ChartPoint[] = [];
  yTicks: YTick[] = [];
  xLabels: { x: number; text: string }[] = [];
  chartLinePath: string = '';
  chartAreaPath: string = '';

  ngOnInit(): void {
    this.loadStats();
    this.loadHistory();
  }

  loadStats(): void {
    this.api.getWeightStats().subscribe({
      next: (data) => {
        this.stats = data;
        // Jeśli jest dzisiejszy wpis lub ostatni wpis, wstępnie ustaw w formularzu wagę
        const todayEntry = data.recentEntries.find(e => e.date === this.todayString);
        if (todayEntry) {
          this.logForm.weightKg = todayEntry.weightKg;
          this.logForm.note = todayEntry.note || '';
        } else if (data.currentWeightKg) {
          this.logForm.weightKg = data.currentWeightKg;
        }
      },
      error: (err) => {
        console.error('Błąd podczas pobierania statystyk:', err);
      }
    });
  }

  loadHistory(): void {
    this.isLoading = true;
    const daysParam = this.selectedRangeDays > 0 ? this.selectedRangeDays : undefined;

    this.api.getWeightHistory(daysParam).subscribe({
      next: (entries) => {
        this.historyEntries = entries;
        this.calculateChart(entries);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Błąd podczas pobierania historii wagi:', err);
        this.isLoading = false;
      }
    });
  }

  selectRange(days: number): void {
    this.selectedRangeDays = days;
    this.loadHistory();
  }

  onDateChange(): void {
    if (!this.stats) return;
    const entry = this.stats.recentEntries.find(e => e.date === this.logForm.date);
    if (entry) {
      this.logForm.weightKg = entry.weightKg;
      this.logForm.note = entry.note || '';
    }
  }

  hasEntryForDate(date: string): boolean {
    return !!this.stats?.recentEntries.some(e => e.date === date);
  }

  adjustWeight(delta: number): void {
    const current = Number(this.logForm.weightKg) || 75.0;
    this.logForm.weightKg = Math.round((current + delta) * 10) / 10;
  }

  saveWeight(): void {
    if (!this.logForm.weightKg || this.logForm.weightKg < 20 || this.logForm.weightKg > 400) {
      this.snackBar.open('Wprowadź prawidłową wagę (20 - 400 kg)', 'Zamknij', { duration: 3000 });
      return;
    }

    this.isSaving = true;
    this.api.logWeight({
      date: this.logForm.date,
      weightKg: Number(this.logForm.weightKg),
      note: this.logForm.note ? this.logForm.note.trim() : null
    }).subscribe({
      next: (saved) => {
        this.isSaving = false;
        this.snackBar.open(`Zapisano pomiar: ${saved.weightKg} kg`, 'OK', { duration: 3000 });
        this.loadStats();
        this.loadHistory();
      },
      error: (err) => {
        this.isSaving = false;
        this.snackBar.open(err.error?.message || 'Błąd podczas zapisywania pomiaru wagi', 'Zamknij', { duration: 4000 });
      }
    });
  }

  deleteEntry(entry: WeightEntryDto): void {
    if (!confirm(`Czy na pewno chcesz usunąć pomiar ${entry.weightKg} kg z dnia ${entry.date}?`)) {
      return;
    }

    this.api.deleteWeightEntry(entry.id).subscribe({
      next: () => {
        this.snackBar.open('Usunięto pomiar wagi.', 'OK', { duration: 2500 });
        this.loadStats();
        this.loadHistory();
      },
      error: () => {
        this.snackBar.open('Błąd podczas usuwania wpisu.', 'Zamknij', { duration: 3000 });
      }
    });
  }

  getWeeklyVerdict(weeklyChange?: number | null): string {
    if (weeklyChange === null || weeklyChange === undefined) return 'Potrzebujesz min. 2 tygodni';
    if (weeklyChange <= -0.8) return 'Szybkie tempo redukcji';
    if (weeklyChange <= -0.3) return 'Optymalne zdrowe tempo redukcji';
    if (weeklyChange < 0) return 'Stabilna redukcja';
    if (weeklyChange === 0) return 'Utrzymanie wagi';
    if (weeklyChange <= 0.4) return 'Czysta masa mięśniowa';
    return 'Przyrost wagi (nadwyżka)';
  }

  formatPointTooltip(pt: ChartPoint): string {
    const noteText = pt.note ? `\nNotatka: ${pt.note}` : '';
    return `${pt.date}: ${pt.weight} kg${noteText}`;
  }

  private calculateChart(entries: WeightEntryDto[]): void {
    if (!entries || entries.length === 0) {
      this.chartPoints = [];
      this.yTicks = [];
      this.xLabels = [];
      this.chartLinePath = '';
      this.chartAreaPath = '';
      return;
    }

    // Sortujemy chronologicznie od najstarszego do najnowszego
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));

    // Wymiary SVG
    const paddingLeft = 60;
    const paddingRight = 30;
    const paddingTop = 30;
    const paddingBottom = 40;
    const svgWidth = 800;
    const svgHeight = 320;
    const chartWidth = svgWidth - paddingLeft - paddingRight;
    const chartHeight = svgHeight - paddingTop - paddingBottom;
    const chartBottom = svgHeight - paddingBottom;

    // Zakres wag (min, max) z marginesem min. 1 kg
    const weights = sorted.map(e => e.weightKg);
    let minW = Math.min(...weights);
    let maxW = Math.max(...weights);

    if (maxW - minW < 1.5) {
      minW = Math.floor(minW) - 0.5;
      maxW = Math.ceil(maxW) + 0.5;
    } else {
      minW = Math.floor(minW * 2) / 2 - 0.5;
      maxW = Math.ceil(maxW * 2) / 2 + 0.5;
    }

    const weightRange = maxW - minW || 1;

    // Generowanie poziomych linii siatki i etykiet Y (4 poziomy)
    this.yTicks = [];
    const tickCount = 4;
    for (let i = 0; i < tickCount; i++) {
      const val = minW + (weightRange * i) / (tickCount - 1);
      const y = paddingTop + chartHeight - ((val - minW) / weightRange) * chartHeight;
      this.yTicks.push({ y: Math.round(y), value: Math.round(val * 10) / 10 });
    }

    // Wyznaczanie punktów (x, y)
    this.chartPoints = sorted.map((entry, index) => {
      const x = sorted.length === 1
        ? paddingLeft + chartWidth / 2
        : paddingLeft + (index / (sorted.length - 1)) * chartWidth;
      const y = paddingTop + chartHeight - ((entry.weightKg - minW) / weightRange) * chartHeight;

      return {
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        date: entry.date,
        weight: entry.weightKg,
        note: entry.note
      };
    });

    // Ścieżka SVG Line
    if (this.chartPoints.length === 1) {
      const p = this.chartPoints[0];
      this.chartLinePath = `M ${p.x - 10} ${p.y} L ${p.x + 10} ${p.y}`;
      this.chartAreaPath = '';
    } else {
      const lineD = this.chartPoints.reduce((acc, pt, idx) => {
        return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
      }, '');
      this.chartLinePath = lineD;

      const first = this.chartPoints[0];
      const last = this.chartPoints[this.chartPoints.length - 1];
      this.chartAreaPath = `${lineD} L ${last.x} ${chartBottom} L ${first.x} ${chartBottom} Z`;
    }

    // Etykiety osi X (maksymalnie 6-7 etykiet, równomiernie rozłożonych)
    this.xLabels = [];
    const maxLabels = Math.min(6, this.chartPoints.length);
    const step = Math.ceil(this.chartPoints.length / maxLabels);

    for (let i = 0; i < this.chartPoints.length; i += step) {
      const pt = this.chartPoints[i];
      // Formatowanie: dd.MM
      const parts = pt.date.split('-');
      const formatted = parts.length === 3 ? `${parts[2]}.${parts[1]}` : pt.date;
      this.xLabels.push({ x: pt.x, text: formatted });
    }

    // Upewnij się, że ostatni punkt ma etykietę jeśli jest oddalony
    const lastPoint = this.chartPoints[this.chartPoints.length - 1];
    if (this.chartPoints.length > 1 && !this.xLabels.some(l => Math.abs(l.x - lastPoint.x) < 30)) {
      const parts = lastPoint.date.split('-');
      const formatted = parts.length === 3 ? `${parts[2]}.${parts[1]}` : lastPoint.date;
      this.xLabels.push({ x: lastPoint.x, text: formatted });
    }
  }
}
