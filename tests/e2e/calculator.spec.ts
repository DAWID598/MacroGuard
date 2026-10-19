import { test, expect } from '@playwright/test';
import { CalculatorPage } from './pages/calculator.page';
import { createAndActivateUser } from '../api/api-helpers';

test.describe('E2E: Profil & Kalkulator BMR / TDEE (Page Object Model)', () => {
  let calcPage: CalculatorPage;
  let authToken: string;
  let authUser: any;

  test.beforeAll(async ({ request }) => {
    // Utwórz i aktywuj konto użytkownika przez API dla szybkości i czystości stanu
    const res = await createAndActivateUser(request);
    authToken = res.token;
    authUser = res;
  });

  test.beforeEach(async ({ page }) => {
    calcPage = new CalculatorPage(page);

    // Zaloguj sesję przez wstrzyknięcie tokenu do localStorage przed nawigacją
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

  test('TC-CALC-001: Wyliczenie BMR i TDEE dla mężczyzny z celem redukcji (-15%) i zapisanie profilu', async ({ page }) => {
    await calcPage.goto();

    // 1. Uzupełnij parametry: Mężczyzna, 25 lat, 80 kg, 180 cm
    await calcPage.setGender('male');
    await calcPage.setBodyMetrics(25, 80, 180);

    // 2. Aktywność: Umiarkowana (1.55)
    await calcPage.selectActivity('Umiarkowana aktywność (1.55)');

    // 3. Cel: Redukcja tkanki tłuszczowej
    await calcPage.selectGoal('Redukcja tkanki tłuszczowej');

    // 4. Waga docelowa: 74 kg
    await calcPage.setTargetWeight(74);

    // 5. Preset deficytu: Standardowe (-15%)
    await calcPage.selectDeficitPreset(15);

    // 6. Weryfikacja przeliczeń matematycznych na żywo w interfejsie
    await expect(calcPage.bmrValue).toContainText('1805');
    await expect(calcPage.tdeeValue).toContainText('2798');
    await expect(calcPage.targetKcal).toContainText('2378');

    // 7. Zapisz profil i sprawdź przejście do Dziennika
    await calcPage.saveProfile();
    await page.waitForURL(/\/diary/);
    expect(page.url()).toContain('/diary');

    // W dzienniku cel kalorii powinien wynosić 2378 kcal
    const targetKcalDiary = page.locator('.main-kcal .numbers span');
    await expect(targetKcalDiary).toContainText('2378 kcal');
  });

  test('TC-CALC-002: Ostrzeżenie medyczne w UI przy deficycie schodzącym poniżej BMR', async () => {
    await calcPage.goto();

    // 1. Kobieta, 30 lat, 55 kg, 160 cm, siedzący tryb życia (1.2)
    await calcPage.setGender('female');
    await calcPage.setBodyMetrics(30, 55, 160);
    await calcPage.selectActivity('Siedzący (1.2)');
    await calcPage.selectGoal('Redukcja tkanki tłuszczowej');

    // 2. Wybierz agresywny własny deficyt: -35%
    await calcPage.selectCustomDeficit(35);

    // 3. Weryfikacja pojawienia się ostrzeżenia medycznego w interfejsie
    await expect(calcPage.bmrAlert).toBeVisible();
    await expect(calcPage.bmrAlert).toContainText('Uwaga: kalorie poniżej BMR');
  });
});

