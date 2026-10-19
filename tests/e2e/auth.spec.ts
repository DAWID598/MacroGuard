import { test, expect } from '@playwright/test';
import { AuthPage } from './pages/auth.page';
import { generateRandomUser, getLatestEmailFor, extractTokenFromEmail, clearMailpit } from '../api/api-helpers';

test.describe('E2E: Moduł Autoryzacji i Bezpieczeństwa (Page Object Model)', () => {
  let authPage: AuthPage;

  test.beforeEach(async ({ page }) => {
    authPage = new AuthPage(page);
  });

  test('TC-AUTH-001 & TC-AUTH-004: Pełny proces rejestracji w UI, aktywacja przez Mailpit i logowanie', async ({ page, request }) => {
    await clearMailpit(request);
    const user = generateRandomUser('e2e-user');

    // 1. Otwórz stronę /auth i przejdź do rejestracji
    await authPage.goto();
    await authPage.register(user.displayName, user.email, user.password);

    // 2. Karta potwierdzenia rejestracji (TC-AUTH-001)
    await authPage.expectActivationCard(user.email);

    // 3. Weryfikacja braku tokenu w localStorage przed aktywacją
    const tokenBefore = await page.evaluate(() => localStorage.getItem('macroguard_auth'));
    expect(tokenBefore).toBeNull();

    // 4. Pobierz wiadomość aktywacyjną z Mailpita
    const emailMsg = await getLatestEmailFor(request, user.email);
    expect(emailMsg).not.toBeNull();
    const token = extractTokenFromEmail(emailMsg);
    expect(token).toBeTruthy();

    // 5. Otwórz link aktywacyjny w przeglądarce (TC-AUTH-004)
    await page.goto(`/auth?tab=confirm-email&email=${encodeURIComponent(user.email)}&token=${encodeURIComponent(token!)}`);

    // 6. Weryfikacja komunikatu sukcesu i logowanie
    await authPage.expectEmailConfirmedBadge();
    await authPage.login(user.email, user.password);

    // 7. Przekierowanie do zalogowanej części aplikacji (/diary lub /calculator)
    await page.waitForURL(/\/(diary|calculator)/);
    const tokenAfter = await page.evaluate(() => localStorage.getItem('macroguard_auth'));
    expect(tokenAfter).not.toBeNull();
  });

  test('TC-AUTH-002: Walidacja restrykcyjnej polityki haseł w czasie rzeczywistym', async ({ page }) => {
    await authPage.goto();
    await authPage.switchToRegister();

    // 1. Panel kryteriów ukryty przy pustym polu
    await expect(authPage.passwordCriteriaBox).not.toBeVisible();

    // 2. Wpisanie hasła 9-znakowego (nie spełnia długości)
    await authPage.registerPasswordInput.fill('Abc12345!');
    await expect(authPage.passwordCriteriaBox).toBeVisible();

    // Kryterium "Min. 10 znaków" niespełnione
    const minLengthCrit = authPage.passwordCriteriaBox.locator('.crit-item:has-text("Min. 10 znaków")');
    await expect(minLengthCrit).not.toHaveClass(/valid/);

    // Przycisk rejestracji zablokowany
    await authPage.registerDisplayNameInput.fill('Tester Dawid');
    await authPage.registerEmailInput.fill('tester@example.com');
    await expect(authPage.registerSubmitBtn).toBeDisabled();

    // 3. Poprawienie hasła do spełniającego wszystkie kryteria
    await authPage.registerPasswordInput.fill('MacroGuard2026!');
    await expect(minLengthCrit).toHaveClass(/valid/);
    await expect(authPage.registerSubmitBtn).toBeEnabled();
  });

  test('TC-AUTH-007: Ochrona tras (AuthGuard) — próba otwarcia chronionych widoków bez tokena', async ({ page }) => {
    // 1. Upewnij się, że użytkownik nie jest zalogowany (brak tokena)
    await page.goto('/auth');
    await page.evaluate(() => localStorage.clear());

    // 2. Próba wejścia na /diary
    await page.goto('/diary');
    await page.waitForURL(/\/auth/);
    expect(page.url()).toContain('/auth');

    // 3. Próba wejścia na /calculator
    await page.goto('/calculator');
    await page.waitForURL(/\/auth/);
    expect(page.url()).toContain('/auth');

    // 4. Próba wejścia na /stats
    await page.goto('/stats');
    await page.waitForURL(/\/auth/);
    expect(page.url()).toContain('/auth');
  });
});

