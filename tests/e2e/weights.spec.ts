import { test, expect } from '@playwright/test';
import { StatsPage } from './pages/stats.page';
import { createAndActivateUser } from '../api/api-helpers';

test.describe('E2E: Monitorowanie Wagi & Postępy (Page Object Model)', () => {
  let statsPage: StatsPage;
  let authToken: string;
  let authUser: any;

  test.beforeAll(async ({ request }) => {
    const res = await createAndActivateUser(request);
    authToken = res.token;
    authUser = res;
  });

  test.beforeEach(async ({ page }) => {
    statsPage = new StatsPage(page);

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

  test('TC-WGHT-001: Zapisanie porannego pomiaru wagi i weryfikacja wykresu trendu SVG', async ({ page }) => {
    await statsPage.goto();

    // 1. Zarejestruj wagę 79.2 kg z notatką
    await statsPage.logWeight(79.2, 'Po treningu rano');

    // 2. Weryfikacja powiadomienia Snackbar
    const snackbar = page.locator('mat-snack-bar-container').last();
    await expect(snackbar).toBeVisible();
    await expect(snackbar).toContainText('Zapisano pomiar');

    // 3. Weryfikacja kafelka KPI "Ostatnia Waga"
    await statsPage.expectCurrentWeight(79.2);

    // 4. Weryfikacja interaktywnego wykresu liniowego SVG
    await statsPage.expectChartVisible();
    const chartPoints = page.locator('svg.weight-svg-chart circle.point-circle');
    await expect(chartPoints).toHaveCount(1);
  });
});
