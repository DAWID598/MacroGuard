import { APIRequestContext, expect } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  displayName: string;
}

export const MAILPIT_API_URL = 'http://localhost:8025/api/v1';

/**
 * Czyści wszystkie wiadomości ze skrzynki testowej Mailpit.
 */
export async function clearMailpit(request: APIRequestContext): Promise<void> {
  try {
    await request.delete(`${MAILPIT_API_URL}/messages`);
  } catch {
    // Ignoruj jeśli Mailpit nie jest dostępny
  }
}

/**
 * Pobiera najnowszą wiadomość e-mail wysłaną na wskazany adres ze skrzynki Mailpit.
 */
export async function getLatestEmailFor(request: APIRequestContext, recipientEmail: string) {
  // Krótki polling (maks 5 prób co 300ms) by dać serwerowi SMTP czas na doręczenie
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await request.get(`${MAILPIT_API_URL}/messages`);
    if (res.ok()) {
      const data = await res.json();
      const messages = data.messages || [];
      const match = messages.find((m: any) =>
        m.To && m.To.some((t: any) => t.Address.toLowerCase() === recipientEmail.toLowerCase())
      );
      if (match) {
        // Pobierz pełną treść wiadomości
        const detailRes = await request.get(`${MAILPIT_API_URL}/message/${match.ID}`);
        if (detailRes.ok()) {
          return await detailRes.json();
        }
        return match;
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
  return null;
}

/**
 * Wyciąga token aktywacyjny z treści wiadomości HTML/tekstowej.
 */
export function extractTokenFromEmail(emailDetails: any): string | null {
  const content = emailDetails.HTML || emailDetails.Text || emailDetails.Snippet || '';
  const match = content.match(/token=([a-zA-Z0-9%_\-]+)/);
  if (match && match[1]) {
    return decodeURIComponent(match[1]);
  }
  return null;
}

/**
 * Generuje unikalnego użytkownika testowego (losowy email).
 */
export function generateRandomUser(prefix = 'test-qa'): TestUser {
  const id = Math.random().toString(36).substring(2, 9);
  return {
    email: `${prefix}-${id}@macroguard-test.local`,
    password: 'MacroGuard2026!',
    displayName: `Tester ${id}`,
  };
}

/**
 * Tworzy i od razu aktywuje użytkownika przez API, zwracając token JWT.
 */
export async function createAndActivateUser(request: APIRequestContext, user?: TestUser): Promise<{ user: TestUser; token: string; userId: string }> {
  const testUser = user || generateRandomUser('active');

  // 1. Rejestracja
  const regRes = await request.post('/api/auth/register', {
    data: {
      email: testUser.email,
      password: testUser.password,
      displayName: testUser.displayName,
    },
  });
  expect(regRes.status()).toBe(200);

  // 2. Pobranie tokena z Mailpita
  const emailMsg = await getLatestEmailFor(request, testUser.email);
  expect(emailMsg).not.toBeNull();
  const token = extractTokenFromEmail(emailMsg);
  expect(token).toBeTruthy();

  // 3. Aktywacja konta
  const confirmRes = await request.post('/api/auth/confirm-email', {
    data: {
      email: testUser.email,
      token: token!,
    },
  });
  expect(confirmRes.status()).toBe(200);

  // 4. Logowanie
  const loginRes = await request.post('/api/auth/login', {
    data: {
      email: testUser.email,
      password: testUser.password,
    },
  });
  expect(loginRes.status()).toBe(200);
  const loginData = await loginRes.json();

  return {
    user: testUser,
    token: loginData.token,
    userId: loginData.userId,
  };
}

