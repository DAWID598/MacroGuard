import { test, expect } from '@playwright/test';
import { createAndActivateUser } from './api-helpers';

test.describe('Moduł Monitorowania Wagi & Postępy (API Integration)', () => {
  let userHeader: { Authorization: string };

  test.beforeAll(async ({ request }) => {
    const { token } = await createAndActivateUser(request);
    userHeader = { Authorization: `Bearer ${token}` };
  });

  test('TC-WGHT-001: Zapisanie pomiaru wagi i weryfikacja w historii oraz statystykach', async ({ request }) => {
    const today = new Date().toISOString().split('T')[0];
    const logData = {
      date: today,
      weightKg: 79.2,
      note: 'Po treningu rano',
    };

    // 1. Zapis pomiaru wagi
    const logRes = await request.post('/api/weights', {
      headers: userHeader,
      data: logData,
    });
    expect(logRes.status()).toBe(200);

    const created = await logRes.json();
    expect(created.id).toBeDefined();
    expect(created.date).toBe(today);
    expect(created.weightKg).toBe(79.2);
    expect(created.note).toBe('Po treningu rano');

    // 2. Weryfikacja w historii
    const historyRes = await request.get('/api/weights/history', {
      headers: userHeader,
    });
    expect(historyRes.status()).toBe(200);
    const history = await historyRes.json();
    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThanOrEqual(1);
    expect(history.some((e: any) => e.id === created.id && e.weightKg === 79.2)).toBe(true);

    // 3. Weryfikacja w podsumowaniu statystyk
    const statsRes = await request.get('/api/weights/stats', {
      headers: userHeader,
    });
    expect(statsRes.status()).toBe(200);
    const stats = await statsRes.json();
    expect(stats.currentWeightKg).toBe(79.2);
    expect(stats.lastRecordedDate).toBe(today);
  });

  test('TC-WGHT-002: Aktualizacja wagi w tym samym dniu (Upsert bez duplikacji wiersza)', async ({ request }) => {
    const testDate = '2026-05-15';

    // 1. Pierwszy wpis
    const firstRes = await request.post('/api/weights', {
      headers: userHeader,
      data: {
        date: testDate,
        weightKg: 80.5,
        note: 'Pierwszy pomiar',
      },
    });
    expect(firstRes.status()).toBe(200);
    const firstEntry = await firstRes.json();

    // 2. Drugi wpis na ten sam dzień (korekta)
    const updateRes = await request.post('/api/weights', {
      headers: userHeader,
      data: {
        date: testDate,
        weightKg: 79.8,
        note: 'Skorygowany pomiar wieczorny',
      },
    });
    expect(updateRes.status()).toBe(200);
    const updatedEntry = await updateRes.json();

    // Identyfikator wpisu powinien być zachowany (aktualizacja rekordu w bazie)
    expect(updatedEntry.id).toBe(firstEntry.id);
    expect(updatedEntry.weightKg).toBe(79.8);
    expect(updatedEntry.note).toBe('Skorygowany pomiar wieczorny');

    // 3. Weryfikacja w historii: dokładnie 1 wpis dla tej daty
    const historyRes = await request.get('/api/weights/history', {
      headers: userHeader,
    });
    expect(historyRes.status()).toBe(200);
    const history = await historyRes.json();
    const dateEntries = history.filter((e: any) => e.date === testDate);
    expect(dateEntries.length).toBe(1);
    expect(dateEntries[0].weightKg).toBe(79.8);
  });

  test('Negatywny: Walidacja zakresu dopuszczalnej wagi (BVA: < 20 kg oraz > 400 kg)', async ({ request }) => {
    const today = new Date().toISOString().split('T')[0];

    // Waga poniżej dolnej granicy (np. 15 kg)
    const tooLowRes = await request.post('/api/weights', {
      headers: userHeader,
      data: {
        date: today,
        weightKg: 15.0,
        note: 'Zbyt niska waga',
      },
    });
    expect(tooLowRes.status()).toBe(400);

    // Waga powyżej górnej granicy (np. 450 kg)
    const tooHighRes = await request.post('/api/weights', {
      headers: userHeader,
      data: {
        date: today,
        weightKg: 450.0,
        note: 'Zbyt wysoka waga',
      },
    });
    expect(tooHighRes.status()).toBe(400);
  });

  test('Usunięcie wpisu wagi (DELETE /api/weights/{id})', async ({ request }) => {
    const deleteDate = '2026-06-01';

    // Utwórz wpis do usunięcia
    const logRes = await request.post('/api/weights', {
      headers: userHeader,
      data: {
        date: deleteDate,
        weightKg: 75.0,
        note: 'Do usunięcia',
      },
    });
    expect(logRes.status()).toBe(200);
    const logged = await logRes.json();

    // Usunięcie wpisu
    const deleteRes = await request.delete(`/api/weights/${logged.id}`, {
      headers: userHeader,
    });
    expect(deleteRes.status()).toBe(204);

    // Ponowne usunięcie zwraca 404 NotFound
    const deleteAgainRes = await request.delete(`/api/weights/${logged.id}`, {
      headers: userHeader,
    });
    expect(deleteAgainRes.status()).toBe(404);
  });
});

