import { Page, Locator, expect } from '@playwright/test';

export class CalculatorPage {
  readonly page: Page;

  // Form locators
  readonly maleRadio: Locator;
  readonly femaleRadio: Locator;
  readonly ageInput: Locator;
  readonly weightInput: Locator;
  readonly heightInput: Locator;
  readonly activitySelect: Locator;
  readonly goalSelect: Locator;
  readonly targetWeightInput: Locator;
  readonly submitBtn: Locator;

  // Preview & Alert locators
  readonly bmrValue: Locator;
  readonly tdeeValue: Locator;
  readonly targetKcal: Locator;
  readonly bmrAlert: Locator;

  constructor(page: Page) {
    this.page = page;
    this.maleRadio = page.locator('mat-radio-button').filter({ hasText: 'Mężczyzna' });
    this.femaleRadio = page.locator('mat-radio-button').filter({ hasText: 'Kobieta' });
    this.ageInput = page.locator('input[formcontrolname="age"]');
    this.weightInput = page.locator('input[formcontrolname="weightKg"]');
    this.heightInput = page.locator('input[formcontrolname="heightCm"]');
    this.activitySelect = page.locator('mat-select[formcontrolname="activityLevel"]');
    this.goalSelect = page.locator('mat-select[formcontrolname="goal"]');
    this.targetWeightInput = page.locator('input[formcontrolname="targetWeightKg"]');
    this.submitBtn = page.locator('button.save-btn[type="submit"]');

    this.bmrValue = page.locator('.metric-item:has-text("BMR") .m-val');
    this.tdeeValue = page.locator('.metric-item:has-text("TDEE") .m-val');
    this.targetKcal = page.locator('.target-highlight .t-kcal');
    this.bmrAlert = page.locator('.bmr-alert');
  }

  async goto() {
    await this.page.goto('/calculator');
    await expect(this.page.locator('.calc-header h1')).toContainText('Kalkulator Zapotrzebowania');
  }

  async setGender(gender: 'male' | 'female') {
    if (gender === 'male') {
      await this.maleRadio.click();
    } else {
      await this.femaleRadio.click();
    }
  }

  async setBodyMetrics(age: number, weightKg: number, heightCm: number) {
    await this.ageInput.fill(age.toString());
    await this.weightInput.fill(weightKg.toString());
    await this.heightInput.fill(heightCm.toString());
  }

  async selectActivity(labelMatcher: string) {
    await this.activitySelect.click();
    await this.page.locator('mat-option').filter({ hasText: labelMatcher }).click();
  }

  async selectGoal(goalLabel: string) {
    await this.goalSelect.click();
    await this.page.locator('mat-option').filter({ hasText: goalLabel }).click();
  }

  async setTargetWeight(targetWeight: number) {
    if (await this.targetWeightInput.isVisible()) {
      await this.targetWeightInput.fill(targetWeight.toString());
    }
  }

  async selectDeficitPreset(pct: number) {
    const tile = this.page.locator(`.preset-tile:has-text("-${pct}%")`);
    if (await tile.isVisible()) {
      await tile.click();
    }
  }

  async selectCustomDeficit(pct: number) {
    const customTile = this.page.locator('.preset-tile:has-text("Własny %")');
    if (await customTile.isVisible()) {
      await customTile.click();
      const customInput = this.page.locator('.custom-pct-box input, input[formcontrolname="deficitPercentage"]');
      await customInput.fill(pct.toString());
    }
  }

  async saveProfile() {
    await expect(this.submitBtn).toBeEnabled();
    await this.submitBtn.click();
  }
}
