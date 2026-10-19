import { Page, Locator, expect } from '@playwright/test';

export class StatsPage {
  readonly page: Page;
  readonly weightInput: Locator;
  readonly noteInput: Locator;
  readonly saveWeightBtn: Locator;
  readonly currentWeightNumber: Locator;
  readonly svgChart: Locator;

  constructor(page: Page) {
    this.page = page;
    this.weightInput = page.locator('.weight-big-input');
    this.noteInput = page.locator('mat-form-field.note-field input');
    this.saveWeightBtn = page.locator('button.save-weight-btn');
    this.currentWeightNumber = page.locator('.kpi-card:has-text("Ostatnia Waga") .kpi-number');
    this.svgChart = page.locator('svg.weight-svg-chart');
  }

  async goto() {
    await this.page.goto('/stats');
    await expect(this.page.locator('.stats-header h1')).toContainText('Waga & Postępy');
  }

  async logWeight(weightKg: number, note?: string) {
    await this.weightInput.fill(weightKg.toString());
    if (note) {
      await this.noteInput.fill(note);
    }
    await expect(this.saveWeightBtn).toBeEnabled();
    await this.saveWeightBtn.click();
  }

  async expectCurrentWeight(weightKg: number) {
    await expect(this.currentWeightNumber).toContainText(weightKg.toFixed(1));
  }

  async expectChartVisible() {
    await expect(this.svgChart).toBeVisible();
  }
}

