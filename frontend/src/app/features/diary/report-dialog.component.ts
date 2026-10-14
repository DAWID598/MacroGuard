import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DietGoal, PeriodReportDto } from '../../core/models/api.models';
import { MacroApiService } from '../../core/services/macro-api.service';

@Component({
  selector: 'app-report-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="report-modal">
      <div class="modal-header no-print">
        <div class="header-left">
          <mat-icon color="primary" class="header-icon">picture_as_pdf</mat-icon>
          <div>
            <h2 class="dialog-title">Raport Żywieniowy & Postępów</h2>
            <span class="dialog-sub">Podsumowanie okresowe z opcją zapisu do PDF lub wydruku</span>
          </div>
        </div>

        <div class="header-right">
          <!-- Zakres: 7 dni / 30 dni -->
          <div class="range-selector">
            <button 
              mat-stroked-button 
              [class.active-range]="selectedDays() === 7" 
              (click)="changeDays(7)">
              Tygodniowy (7 dni)
            </button>
            <button 
              mat-stroked-button 
              [class.active-range]="selectedDays() === 30" 
              (click)="changeDays(30)">
              Miesięczny (30 dni)
            </button>
          </div>

          <button mat-flat-button color="primary" class="print-btn" (click)="printReport()">
            <mat-icon>print</mat-icon>
            Drukuj / Zapisz PDF
          </button>
          <button mat-icon-button mat-dialog-close matTooltip="Zamknij">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      </div>

      <mat-dialog-content class="modal-content print-area">
        @if (isLoading()) {
          <div class="loading-box">
            <mat-spinner diameter="40"></mat-spinner>
            <span>Generowanie raportu...</span>
          </div>
        } @else {
          @if (report(); as rep) {
            <!-- PAPIER A4 / WYDRUK DOKUMENTU -->
            <div class="printable-document">
            <!-- Pasek nagłówka dokumentu -->
            <div class="doc-brand-bar">
              <div class="doc-brand">
                <span class="brand-title">MacroGuard</span>
                <span class="brand-subtitle">Inteligentny Dziennik & Monitor Sylwetki</span>
              </div>
              <div class="doc-meta">
                <span>Wygenerowano: {{ rep.generatedAtUtc | date:'dd.MM.yyyy HH:mm' }}</span>
                <span>Okres: <strong>{{ rep.startDate | date:'dd.MM.yyyy' }} – {{ rep.endDate | date:'dd.MM.yyyy' }}</strong></span>
              </div>
            </div>

            <!-- Informacje o profilu -->
            <div class="user-strip">
              <div class="strip-item">
                <span class="strip-label">Użytkownik:</span>
                <strong class="strip-value">{{ rep.userDisplayName }}</strong>
              </div>
              <div class="strip-item">
                <span class="strip-label">Cel:</span>
                <strong class="strip-value">{{ getGoalLabel(rep.goal) }}</strong>
              </div>
              <div class="strip-item">
                <span class="strip-label">Cel kalorii:</span>
                <strong class="strip-value">{{ rep.targetCalories }} kcal</strong>
              </div>
              <div class="strip-item">
                <span class="strip-label">Rozkład B / W / T:</span>
                <strong class="strip-value">{{ rep.targetProteinGrams }}g / {{ rep.targetCarbsGrams }}g / {{ rep.targetFatGrams }}g</strong>
              </div>
            </div>

            <!-- Kafelki KPI w raporcie -->
            <div class="report-kpi-grid">
              <div class="kpi-box">
                <span class="kpi-title">Średnie Kalorie</span>
                <div class="kpi-main-val">
                  {{ rep.avgCalories | number:'1.0-0' }} <span class="val-unit">kcal / dzień</span>
                </div>
                <span class="kpi-note">
                  {{ rep.calorieAdherencePercent }}% celu ({{ rep.targetCalories }} kcal)
                </span>
              </div>

              <div class="kpi-box">
                <span class="kpi-title">Średnie Białko</span>
                <div class="kpi-main-val">
                  {{ rep.avgProtein | number:'1.0-1' }} <span class="val-unit">g / dzień</span>
                </div>
                <span class="kpi-note">
                  Cel: {{ rep.targetProteinGrams }} g dziennie
                </span>
              </div>

              <div class="kpi-box">
                <span class="kpi-title">Zmiana Wagi</span>
                <div class="kpi-main-val" [class.val-green]="(rep.weightChangeKg ?? 0) <= 0">
                  {{ (rep.weightChangeKg ?? 0) > 0 ? '+' : '' }}{{ rep.weightChangeKg ? (rep.weightChangeKg | number:'1.1-2') : '0.0' }}
                  <span class="val-unit">kg</span>
                </div>
                <span class="kpi-note">
                  {{ rep.startWeightKg ? rep.startWeightKg + ' kg' : '—' }} → {{ rep.endWeightKg ? rep.endWeightKg + ' kg' : '—' }}
                </span>
              </div>

              <div class="kpi-box">
                <span class="kpi-title">Dni z wpisem</span>
                <div class="kpi-main-val">
                  {{ rep.loggedDays }} / {{ rep.totalDays }} <span class="val-unit">dni</span>
                </div>
                <span class="kpi-note">
                  Regularność: {{ (rep.loggedDays / rep.totalDays * 100) | number:'1.0-0' }}%
                </span>
              </div>
            </div>

            <!-- Tabela szczegółowa każdego dnia -->
            <div class="report-table-section">
              <h3 class="table-section-title">Szczegółowy wykaz dzienny</h3>
              <table class="report-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Dzień</th>
                    <th>Waga</th>
                    <th>Spożyte kcal</th>
                    <th>Białko</th>
                    <th>Węgle</th>
                    <th>Tłuszcze</th>
                    <th>Bilans kaloryczny</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of rep.dailyRecords; track row.date) {
                    <tr [class.empty-day-row]="row.consumedCalories === 0">
                      <td><strong>{{ row.date | date:'dd.MM.yyyy' }}</strong></td>
                      <td>{{ row.date | date:'EEEE' }}</td>
                      <td>
                        @if (row.weightKg) {
                          <span class="weight-tag">{{ row.weightKg | number:'1.1-1' }} kg</span>
                        } @else {
                          <span class="text-muted">—</span>
                        }
                      </td>
                      <td>
                        <strong>{{ row.consumedCalories | number:'1.0-0' }} kcal</strong>
                      </td>
                      <td>{{ row.consumedProtein | number:'1.0-1' }} g</td>
                      <td>{{ row.consumedCarbs | number:'1.0-1' }} g</td>
                      <td>{{ row.consumedFat | number:'1.0-1' }} g</td>
                      <td>
                        @if (row.consumedCalories > 0) {
                          <span 
                            class="delta-badge"
                            [ngClass]="(row.consumedCalories - rep.targetCalories) <= 0 ? 'delta-neg' : 'delta-pos'">
                            {{ (row.consumedCalories - rep.targetCalories) > 0 ? '+' : '' }}{{ (row.consumedCalories - rep.targetCalories) | number:'1.0-0' }} kcal
                          </span>
                        } @else {
                          <span class="text-muted">Brak wpisów</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Stopka dokumentu -->
            <div class="doc-footer">
              <span>MacroGuard — Aplikacja do kontroli diety, BMR/TDEE i wagi ciała.</span>
              <span>Strona 1 z 1</span>
            </div>
          </div>
        }
      }
      </mat-dialog-content>
    </div>
  `,
  styles: [`
    .report-modal {
      display: flex;
      flex-direction: column;
      max-height: 90vh;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #e2e8f0;
      gap: 16px;
      flex-wrap: wrap;

      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;

        .header-icon {
          font-size: 28px;
          width: 28px;
          height: 28px;
        }

        .dialog-title {
          margin: 0;
          font-size: 18px;
          font-weight: 700;
          color: #0f172a;
        }

        .dialog-sub {
          font-size: 12.5px;
          color: #64748b;
        }
      }

      .header-right {
        display: flex;
        align-items: center;
        gap: 10px;
      }
    }

    .range-selector {
      display: flex;
      gap: 6px;

      button {
        font-size: 12px;
        border-radius: 8px;
        height: 34px;

        &.active-range {
          background: #eff6ff;
          color: #2563eb;
          border-color: #3b82f6;
          font-weight: 700;
        }
      }
    }

    .print-btn {
      border-radius: 8px;
      font-weight: 600;
      height: 36px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .modal-content {
      padding: 24px;
      overflow-y: auto;
      background: #f8fafc;
    }

    .loading-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 0;
      gap: 14px;
      color: #64748b;
    }

    /* PAPIER DOKUMENTU A4 */
    .printable-document {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 32px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
      max-width: 820px;
      margin: 0 auto;
    }

    .doc-brand-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 14px;
      margin-bottom: 18px;

      .brand-title {
        display: block;
        font-size: 24px;
        font-weight: 800;
        color: #2563eb;
        letter-spacing: -0.5px;
      }

      .brand-subtitle {
        font-size: 12px;
        color: #64748b;
      }

      .doc-meta {
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        font-size: 12px;
        color: #475569;
        gap: 2px;
      }
    }

    .user-strip {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      background: #f1f5f9;
      border-radius: 8px;
      padding: 10px 14px;
      margin-bottom: 20px;

      .strip-item {
        display: flex;
        flex-direction: column;

        .strip-label {
          font-size: 11px;
          text-transform: uppercase;
          color: #64748b;
          font-weight: 600;
        }

        .strip-value {
          font-size: 13.5px;
          color: #0f172a;
        }
      }
    }

    .report-kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }

    .kpi-box {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      gap: 2px;

      .kpi-title {
        font-size: 11.5px;
        color: #64748b;
        font-weight: 600;
        text-transform: uppercase;
      }

      .kpi-main-val {
        font-size: 20px;
        font-weight: 800;
        color: #0f172a;

        &.val-green {
          color: #16a34a;
        }

        .val-unit {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
        }
      }

      .kpi-note {
        font-size: 11px;
        color: #94a3b8;
      }
    }

    .report-table-section {
      margin-bottom: 24px;

      .table-section-title {
        font-size: 14px;
        font-weight: 700;
        color: #0f172a;
        margin: 0 0 10px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
    }

    .report-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12.5px;

      th {
        background: #f8fafc;
        border-bottom: 2px solid #e2e8f0;
        color: #475569;
        font-weight: 600;
        padding: 8px 10px;
        text-align: left;
      }

      td {
        padding: 8px 10px;
        border-bottom: 1px solid #f1f5f9;
        color: #1e293b;
      }

      .weight-tag {
        font-weight: 700;
        color: #2563eb;
      }

      .empty-day-row {
        opacity: 0.6;
      }

      .delta-badge {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 4px;
        font-weight: 700;
        font-size: 11px;

        &.delta-neg {
          background: #dcfce7;
          color: #166534;
        }

        &.delta-pos {
          background: #fee2e2;
          color: #991b1b;
        }
      }

      .text-muted {
        color: #94a3b8;
      }
    }

    .doc-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 12px;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #94a3b8;
    }

    /* REGUŁY WYDRUKU DO PDF */
    @media print {
      .no-print, mat-toolbar, .top-nav, button {
        display: none !important;
      }

      body, html, .modal-content {
        background: #ffffff !important;
        padding: 0 !important;
        margin: 0 !important;
        overflow: visible !important;
      }

      .printable-document {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        max-width: 100% !important;
      }
    }
  `]
})
export class ReportDialogComponent implements OnInit {
  private readonly api = inject(MacroApiService);
  private readonly dialogRef = inject(MatDialogRef<ReportDialogComponent>);

  readonly selectedDays = signal<number>(7);
  readonly report = signal<PeriodReportDto | null>(null);
  readonly isLoading = signal<boolean>(true);

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.isLoading.set(true);
    this.api.getPeriodReport(this.selectedDays()).subscribe({
      next: (data) => {
        this.report.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Błąd podczas generowania raportu:', err);
        this.isLoading.set(false);
      }
    });
  }

  changeDays(days: number): void {
    this.selectedDays.set(days);
    this.loadReport();
  }

  printReport(): void {
    window.print();
  }

  getGoalLabel(goal: DietGoal): string {
    switch (goal) {
      case DietGoal.Cut: return 'Redukcja (Ubytek tkanki tłuszczowej)';
      case DietGoal.Bulk: return 'Masa (Budowa mięśni)';
      default: return 'Utrzymanie wagi / Rekompozycja';
    }
  }
}
