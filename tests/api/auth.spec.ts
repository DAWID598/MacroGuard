import { test, expect } from '@playwright/test';
import {
  clearMailpit,
  extractTokenFromEmail,
  generateRandomUser,
  getLatestEmailFor,
} from './api-helpers';

test.describe('Moduł Autoryzacji i Bezpieczeństwa (API Integration)', () => {
  test.beforeEach(async ({ request }) => {
    await clearMailpit(request);
  });

  test('TC-AUTH-001 & BUG-002: Rejestracja nowego konta wysyła e-mail i NIE wydaje tokenu JWT przed aktywacją', async ({
    request,
  }) => {
    // Arrange
    const user = generateRandomUser('reg');

    // Act
    const response = await request.post('/api/auth/register', {
      data: {
        email: user.email,
        password: user.password,
        displayName: user.displayName,
      },
    });

    // Assert (HTTP 200)
    expect(response.status()).toBe(200);
    const body = await response.json();

    // Weryfikacja BUG-002: Token JWT nie może być zwrócony przy rejestracji
    expect(body.token).toBeUndefined();
    expect(body.requiresEmailConfirmation).toBe(true);
    expect(body.email).toBe(user.email);
    expect(body.message).toContain('Konto zostało pomyślnie utworzone');

    // Weryfikacja doręczenia wiadomości w Mailpicie
    const emailMsg = await getLatestEmailFor(request, user.email);
    expect(emailMsg).not.toBeNull();
    expect(emailMsg.Subject).toContain('Aktywuj swoje konto');
  });

  test('TC-AUTH-003: Odrzucenie próby logowania przed aktywacją adresu e-mail (HTTP 403 Forbidden)', async ({
    request,
  }) => {
    // Arrange: zarejestruj konto, ale NIE potwierdzaj e-maila
    const unconfirmedUser = generateRandomUser('unconfirmed');
    const regRes = await request.post('/api/auth/register', {
      data: {
        email: unconfirmedUser.email,
        password: unconfirmedUser.password,
        displayName: unconfirmedUser.displayName,
      },
    });
    expect(regRes.status()).toBe(200);

    // Act: próba zalogowania prawidłowymi danymi
    const loginRes = await request.post('/api/auth/login', {
      data: {
        email: unconfirmedUser.email,
        password: unconfirmedUser.password,
      },
    });

    // Assert: serwer odrzuca żądanie kodem 403 z informacją o konieczności aktywacji
    expect(loginRes.status()).toBe(403);
    const body = await loginRes.json();
    expect(body.requiresEmailConfirmation).toBe(true);
    expect(body.message).toContain('nie został jeszcze aktywowany');
  });

  test('TC-AUTH-004: Pomyślna aktywacja konta tokenem z Mailpita i zalogowanie (HTTP 200)', async ({
    request,
  }) => {
    // Arrange
    const user = generateRandomUser('activate');
    await request.post('/api/auth/register', {
      data: {
        email: user.email,
        password: user.password,
        displayName: user.displayName,
      },
    });

    // Pobierz token z Mailpita
    const emailMsg = await getLatestEmailFor(request, user.email);
    expect(emailMsg).not.toBeNull();
    const token = extractTokenFromEmail(emailMsg);
    expect(token).toBeTruthy();

    // Act: Potwierdzenie adresu e-mail
    const confirmRes = await request.post('/api/auth/confirm-email', {
      data: {
        email: user.email,
        token: token!,
      },
    });

    // Assert: Potwierdzenie pomyślne
    expect(confirmRes.status()).toBe(200);
    const confirmBody = await confirmRes.json();
    expect(confirmBody.message).toContain('potwierdzony');

    // Act 2: Próba logowania po aktywacji
    const loginRes = await request.post('/api/auth/login', {
      data: {
        email: user.email,
        password: user.password,
      },
    });

    // Assert 2: Pomyślne logowanie i wydanie tokenu JWT
    expect(loginRes.status()).toBe(200);
    const loginBody = await loginRes.json();
    expect(loginBody.token).toBeTruthy();
    expect(loginBody.email).toBe(user.email);
    expect(loginBody.displayName).toBe(user.displayName);
  });

  test('TC-AUTH-005: Ochrona przed atakiem Brute Force — blokada konta po 5 nieudanych próbach (HTTP 423 Locked)', async ({
    request,
  }) => {
    // Arrange: Utwórz i aktywuj konto
    const user = generateRandomUser('brute');
    await request.post('/api/auth/register', {
      data: {
        email: user.email,
        password: user.password,
        displayName: user.displayName,
      },
    });
    const emailMsg = await getLatestEmailFor(request, user.email);
    const token = extractTokenFromEmail(emailMsg);
    await request.post('/api/auth/confirm-email', {
      data: { email: user.email, token: token! },
    });

    // Act: Wykonaj 4 błędne próby logowania (powinny zwrócić 401 z ostrzeżeniem)
    for (let i = 1; i <= 4; i++) {
      const failedAttempt = await request.post('/api/auth/login', {
        data: {
          email: user.email,
          password: 'BledneHaslo123!',
        },
      });
      expect(failedAttempt.status()).toBe(401);
      const failedBody = await failedAttempt.json();
      if (i === 4) {
        expect(failedBody.message).toContain('pozostała 1 próba');
      }
    }

    // Act: 5. błędna próba logowania
    const fifthAttempt = await request.post('/api/auth/login', {
      data: {
        email: user.email,
        password: 'BledneHaslo123!',
      },
    });

    // Assert: Konto zablokowane kodem 423 Locked
    expect(fifthAttempt.status()).toBe(423);
    const fifthBody = await fifthAttempt.json();
    expect(fifthBody.message).toContain('zablokowane');

    // Act: 6. próba — podanie PRAWIDŁOWEGO hasła w trakcie trwania blokady
    const sixthAttempt = await request.post('/api/auth/login', {
      data: {
        email: user.email,
        password: user.password,
      },
    });

    // Assert: Serwer nadal odrzuca żądanie kodem 423 Locked
    expect(sixthAttempt.status()).toBe(423);
  });

  test('TC-AUTH-007: Ochrona tras [Authorize] przed nieautoryzowanym dostępem (HTTP 401 Unauthorized)', async ({
    request,
  }) => {
    // Act & Assert 1: Próba pobrania dziennika bez nagłówka Bearer
    const diaryRes = await request.get('/api/diary');
    expect(diaryRes.status()).toBe(401);

    // Act & Assert 2: Próba dostępu do bazy produktów bez nagłówka Bearer
    const foodsRes = await request.get('/api/foods');
    expect(foodsRes.status()).toBe(401);

    // Act & Assert 3: Próba rejestracji wagi bez nagłówka Bearer
    const weightRes = await request.post('/api/weights', {
      data: { date: '2026-10-19', weightKg: 80 },
    });
    expect(weightRes.status()).toBe(401);
  });
});
