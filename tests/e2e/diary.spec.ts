import { test, expect } from '@playwright/test';
import { DiaryPage } from './pages/diary.page';
import { createAndActivateUser } from '../api/api-helpers';

test.describe('E2E: Dziennik Żywieniowy & Obsługa Posiłków (Page Object Model)', () => {
  let diaryPage: DiaryPage;
  let authToken: string;
  let authUser: any;

  test.beforeAll(async ({ request }) => {
    const res = await createAndActivateUser(request);
    authToken = res.token;
    authUser = res;
  });

  test.beforeEach(async ({ page }) => {
    diaryPage = new DiaryPage(page);

    await page.goto('/auth');
    await page.evaluate((authData) => {
      localStorage.setItem('macroguard_auth', JSON.stringify({
        token: authData.token,
        email: authData.user.email,
        displayName: authData.user.displayName,
        userId: authData.userId,
      }));
    }, { token: authToken, user: authUser.user, userId: authUser.userId });
  });

  test('TC-DIARY-001 & TC-DIARY-003: Dodanie produktu z bazy, aktualizacja sum makro i usunięcie pozycji', async ({ page }) => {
    await diaryPage.goto();

    // 1. Sprawdź, czy początkowo bilans dnia to 0 kcal
    await expect(diaryPage.summaryKcalNumber).toHaveText('0');

    // 2. Otwórz okno dodawania dla posiłku "Śniadanie"
    await diaryPage.openAddFood('Śniadanie');

    // 3. Wyszukaj "Jajko" i dodaj 150g
    await diaryPage.addFoodFromModal('Jajko', 150);

    // 4. Weryfikacja powiadomienia Snackbar
    await expect(diaryPage.snackbar).toBeVisible();
    await expect(diaryPage.snackbar).toContainText('Dodano');

    // 5. Weryfikacja dodanej pozycji w karcie Śniadanie
    const breakfastCard = diaryPage.getMealCard('Śniadanie');
    await expect(breakfastCard.locator('.entry-row')).toBeVisible();
    await expect(breakfastCard.locator('.grams-pill')).toContainText('150 g');
    await expect(breakfastCard.locator('.meal-sub-macros .macro-badge.kcal')).toContainText('215 kcal');

    // 6. Weryfikacja sumy kalorii w podsumowaniu górnym (215 kcal)
    await expect(diaryPage.summaryKcalNumber).toHaveText('215');

    // 7. Usunięcie pozycji z posiłku (TC-DIARY-003)
    await diaryPage.removeEntry('Śniadanie', 'Jajko');
    await expect(diaryPage.snackbar).toBeVisible();
    await expect(diaryPage.snackbar).toContainText('Wpis został usunięty');

    // 8. Podsumowanie wraca do 0 kcal, posiłek jest pusty
    await expect(diaryPage.summaryKcalNumber).toHaveText('0');
    await expect(breakfastCard.locator('.entry-row')).toHaveCount(0);
  });

  test('TC-DIARY-004 & BUG-003: Masowe wyczyszczenie posiłku z obsługą okna dialogowego', async ({ page }) => {
    await diaryPage.goto();

    // 1. Dodaj pozycję do Obiadu
    await diaryPage.openAddFood('Obiad');
    await diaryPage.addFoodFromModal('Oliwa', 20);

    const lunchCard = diaryPage.getMealCard('Obiad');
    await expect(lunchCard.locator('.entry-row')).toHaveCount(1);

    // 2. Kliknij przycisk wyczyszczenia posiłku i zaakceptuj confirm
    await diaryPage.clearMeal('Obiad');

    // 3. Pozycje w Obiedzie powinny zniknąć
    await expect(lunchCard.locator('.entry-row')).toHaveCount(0);
    await expect(lunchCard.locator('.macro-badge.kcal')).toContainText('0 kcal');
  });
});
