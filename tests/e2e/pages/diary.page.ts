import { Page, Locator, expect } from '@playwright/test';

export class DiaryPage {
  readonly page: Page;
  readonly summaryKcalNumber: Locator;
  readonly summaryProteinNumber: Locator;
  readonly summaryCarbsNumber: Locator;
  readonly summaryFatNumber: Locator;
  readonly snackbar: Locator;

  constructor(page: Page) {
    this.page = page;
    this.summaryKcalNumber = page.locator('.main-kcal .numbers strong');
    this.summaryProteinNumber = page.locator('.protein-box .numbers strong');
    this.summaryCarbsNumber = page.locator('.carbs-box .numbers strong');
    this.summaryFatNumber = page.locator('.fat-box .numbers strong');
    this.snackbar = page.locator('mat-snack-bar-container').last();
  }

  async goto() {
    await this.page.goto('/diary');
    await expect(this.page.locator('.diary-header h1')).toContainText('Dziennik Żywieniowy');
  }

  getMealCard(mealName: string): Locator {
    return this.page.locator('.meal-card').filter({ hasText: mealName });
  }

  async openAddFood(mealName: string) {
    const mealCard = this.getMealCard(mealName);
    await mealCard.locator('button.add-btn').click();
    await expect(this.page.locator('mat-dialog-container h2')).toContainText(`Dodaj produkt — ${mealName}`);
  }

  async addFoodFromModal(searchQuery: string, grams: number) {
    const dialog = this.page.locator('mat-dialog-container');
    const searchInput = dialog.locator('input[placeholder*="Wpisz nazwę"]');
    await searchInput.fill(searchQuery);

    // Wybierz pierwszy pasujący produkt z listy
    const foodRow = dialog.locator('.food-item-row').first();
    await expect(foodRow).toBeVisible();
    await foodRow.click();

    // Wpisz gramaturę
    const gramsInput = dialog.locator('.gram-input input');
    await gramsInput.fill(grams.toString());

    // Kliknij dodaj
    const submitBtn = dialog.locator('button:has-text("Dodaj do posiłku")');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Dialog powinien zniknąć
    await expect(dialog).not.toBeVisible();
  }

  async removeEntry(mealName: string, foodNameMatcher: string) {
    const mealCard = this.getMealCard(mealName);
    const entryRow = mealCard.locator('.entry-row').filter({ hasText: foodNameMatcher });
    await expect(entryRow).toBeVisible();
    await entryRow.locator('button[mattooltip="Usuń z posiłku"]').click();
  }

  async clearMeal(mealName: string) {
    const mealCard = this.getMealCard(mealName);
    const clearBtn = mealCard.locator('button.clear-meal-btn');
    await expect(clearBtn).toBeVisible();

    this.page.once('dialog', async (dialog) => {
      await dialog.accept();
    });

    await clearBtn.click();
  }
}
