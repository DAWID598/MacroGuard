import { defineConfig, devices } from '@playwright/test';

/**
 * Konfiguracja Playwright dla projektu MacroGuard.
 * Obsługuje dwa projekty testowe:
 * - 'api': Testy integracyjne REST API (bez przeglądarki, port 5000)
 * - 'e2e': Testy interfejsu użytkownika w przeglądarce (port 4200)
 */
export default defineConfig({
  testDir: './',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: false, // sekwencyjnie dla testów stanu bazy / auth
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1, // 1 worker by unikać konfliktów w bazie danych i blokad Brute Force
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'api',
      testDir: './api',
      use: {
        baseURL: process.env.API_BASE_URL || 'http://localhost:5000',
        extraHTTPHeaders: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      },
    },
    {
      name: 'e2e',
      testDir: './e2e',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: process.env.CLIENT_BASE_URL || 'http://localhost:4200',
      },
    },
  ],
});

