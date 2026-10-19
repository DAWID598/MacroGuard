import { test, expect } from '@playwright/test';
import { createAndActivateUser } from './api-helpers';

test.describe('Moduł Dziennika Żywieniowego & Obsługa Posiłków (API Integration)', () => {
  let userHeader: { Authorization: string };
  let eggFoodId: string;
  let chickenFoodId: string;
  let oliveOilFoodId: string;

  test.beforeAll(async ({ request }) => {
    // 1. Zarejestruj i aktywuj dedykowanego użytkownika
    const { token } = await createAndActivateUser(request);
    userHeader = { Authorization: `Bearer ${token}` };

    // 2. Pobierz identyfikatory standardowych produktów z bazy
    const eggRes = await request.get('/api/foods?query=Jajko', { headers: userHeader });
    const eggFoods = await eggRes.json();
    const egg = eggFoods.find((f: any) => f.name.toLowerCase().includes('jajko'));

    const chickenRes = await request.get('/api/foods?query=kurczak', { headers: userHeader });
    const chickenFoods = await chickenRes.json();
    const chicken = chickenFoods.find((f: any) => f.name.toLowerCase().includes('kurczak'));

    const oliveRes = await request.get('/api/foods?query=Oliwa', { headers: userHeader });
    const oliveFoods = await oliveRes.json();
    const olive = oliveFoods.find((f: any) => f.name.toLowerCase().includes('oliwa'));

    expect(egg).toBeDefined();
    expect(chicken).toBeDefined();
    expect(olive).toBeDefined();

    eggFoodId = egg.id;
    chickenFoodId = chicken.id;
    oliveOilFoodId = olive.id;
  });

  test('TC-DIARY-001: Dodanie produktu z bazy do posiłku i przeliczenie makroskładników w dzienniku', async ({ request }) => {
    const testDate = '2026-06-10';

    // 1. Dodaj 150g jajka do Śniadania (MealType = 0)
    // Jajko: 143 kcal / 100g -> 150g = 214.5 kcal
    const addRes = await request.post('/api/diary', {
      headers: userHeader,
      data: {
        foodItemId: eggFoodId,
        consumedDate: testDate,
        mealType: 0, // Breakfast
        weightGrams: 150,
      },
    });
    expect(addRes.status()).toBe(200);

    const entry = await addRes.json();
    expect(entry.id).toBeDefined();
    expect(entry.foodItemId).toBe(eggFoodId);
    expect(entry.weightGrams).toBe(150);
    expect(entry.calories).toBeCloseTo(214.5, 1);

    // 2. Pobierz dziennik z tego dnia i zweryfikuj podsumowanie posiłku oraz dnia
    const diaryRes = await request.get(`/api/diary?date=${testDate}`, {
      headers: userHeader,
    });
    expect(diaryRes.status()).toBe(200);

    const diary = await diaryRes.json();
    expect(diary.date).toBe(testDate);
    expect(diary.consumedCalories).toBeCloseTo(214.5, 1);

    const breakfast = diary.meals.find((m: any) => m.mealType === 0);
    expect(breakfast).toBeDefined();
    expect(breakfast.totalCalories).toBeCloseTo(214.5, 1);
    expect(breakfast.entries.length).toBe(1);
    expect(breakfast.entries[0].id).toBe(entry.id);
  });

  test('TC-DIARY-003: Usunięcie pojedynczej pozycji z posiłku i aktualizacja sum', async ({ request }) => {
    const testDate = '2026-06-11';

    // 1. Dodaj pozycję do posiłku
    const addRes = await request.post('/api/diary', {
      headers: userHeader,
      data: {
        foodItemId: eggFoodId,
        consumedDate: testDate,
        mealType: 0,
        weightGrams: 100,
      },
    });
    expect(addRes.status()).toBe(200);
    const entry = await addRes.json();

    // 2. Usuń pozycję
    const deleteRes = await request.delete(`/api/diary/${entry.id}`, {
      headers: userHeader,
    });
    expect(deleteRes.status()).toBe(204);

    // 3. Sprawdź, czy dziennik ma teraz 0 kalorii i pustą listę pozycji
    const diaryRes = await request.get(`/api/diary?date=${testDate}`, {
      headers: userHeader,
    });
    expect(diaryRes.status()).toBe(200);
    const diary = await diaryRes.json();
    expect(diary.consumedCalories).toBe(0);

    const breakfast = diary.meals.find((m: any) => m.mealType === 0);
    expect(breakfast.entries.length).toBe(0);
    expect(breakfast.totalCalories).toBe(0);
  });

  test('TC-DIARY-004 & BUG-003: Wyczyszczenie wszystkich pozycji z danego posiłku (DELETE /api/diary/clear-meal)', async ({ request }) => {
    const testDate = '2026-06-12';
    const lunchType = 1; // Obiad

    // 1. Dodaj 3 różne produkty do Obiadu
    await request.post('/api/diary', {
      headers: userHeader,
      data: { foodItemId: chickenFoodId, consumedDate: testDate, mealType: lunchType, weightGrams: 200 },
    });
    await request.post('/api/diary', {
      headers: userHeader,
      data: { foodItemId: oliveOilFoodId, consumedDate: testDate, mealType: lunchType, weightGrams: 15 },
    });
    await request.post('/api/diary', {
      headers: userHeader,
      data: { foodItemId: eggFoodId, consumedDate: testDate, mealType: lunchType, weightGrams: 100 },
    });

    // Sprawdź, czy w obiedzie są 3 pozycje
    const preCheck = await request.get(`/api/diary?date=${testDate}`, { headers: userHeader });
    const preData = await preCheck.json();
    const preLunch = preData.meals.find((m: any) => m.mealType === lunchType);
    expect(preLunch.entries.length).toBe(3);

    // 2. Wywołaj endpoint masowego czyszczenia posiłku
    const clearRes = await request.delete(`/api/diary/clear-meal?date=${testDate}&mealType=${lunchType}`, {
      headers: userHeader,
    });
    expect(clearRes.status()).toBe(200);
    const clearData = await clearRes.json();
    expect(clearData.count).toBe(3);

    // 3. Zweryfikuj, że Obiad jest pusty i kalorie wynoszą 0
    const postCheck = await request.get(`/api/diary?date=${testDate}`, { headers: userHeader });
    const postData = await postCheck.json();
    const postLunch = postData.meals.find((m: any) => m.mealType === lunchType);
    expect(postLunch.entries.length).toBe(0);
    expect(postLunch.totalCalories).toBe(0);
  });

  test('TC-DIARY-007: Kopiowanie posiłku z dnia poprzedniego (POST /api/diary/copy-meal)', async ({ request }) => {
    const sourceDate = '2026-06-13';
    const targetDate = '2026-06-14';

    // 1. Dodaj produkt do dnia wczorajszego (Śniadanie)
    await request.post('/api/diary', {
      headers: userHeader,
      data: {
        foodItemId: eggFoodId,
        consumedDate: sourceDate,
        mealType: 0,
        weightGrams: 120,
      },
    });

    // 2. Skopiuj posiłek z dnia źródłowego do dnia docelowego
    const copyRes = await request.post('/api/diary/copy-meal', {
      headers: userHeader,
      data: {
        sourceDate: sourceDate,
        sourceMealType: 0,
        targetDate: targetDate,
        targetMealType: 0,
      },
    });
    expect(copyRes.status()).toBe(200);
    const copyResult = await copyRes.json();
    expect(copyResult.copiedEntriesCount).toBe(1);

    // 3. Sprawdź, czy w dniu docelowym pojawił się skopiowany wpis
    const targetDiaryRes = await request.get(`/api/diary?date=${targetDate}`, {
      headers: userHeader,
    });
    expect(targetDiaryRes.status()).toBe(200);
    const targetDiary = await targetDiaryRes.json();
    const breakfast = targetDiary.meals.find((m: any) => m.mealType === 0);
    expect(breakfast.entries.length).toBe(1);
    expect(breakfast.entries[0].foodItemId).toBe(eggFoodId);
    expect(breakfast.entries[0].weightGrams).toBe(120);
  });

  test('Negatywny: Walidacja gramatury oraz nieistniejącego produktu', async ({ request }) => {
    const today = '2026-06-15';

    // 1. Waga <= 0 (Range(1, 5000))
    const zeroGramsRes = await request.post('/api/diary', {
      headers: userHeader,
      data: {
        foodItemId: eggFoodId,
        consumedDate: today,
        mealType: 0,
        weightGrams: 0,
      },
    });
    expect(zeroGramsRes.status()).toBe(400);

    // 2. Waga ujemna (-50g)
    const negativeGramsRes = await request.post('/api/diary', {
      headers: userHeader,
      data: {
        foodItemId: eggFoodId,
        consumedDate: today,
        mealType: 0,
        weightGrams: -50,
      },
    });
    expect(negativeGramsRes.status()).toBe(400);

    // 3. Waga powyżej limitu (6000g)
    const excessiveGramsRes = await request.post('/api/diary', {
      headers: userHeader,
      data: {
        foodItemId: eggFoodId,
        consumedDate: today,
        mealType: 0,
        weightGrams: 6000,
      },
    });
    expect(excessiveGramsRes.status()).toBe(400);

    // 4. Nieistniejący produkt (losowy GUID) -> 404 NotFound
    const nonExistentFoodRes = await request.post('/api/diary', {
      headers: userHeader,
      data: {
        foodItemId: '00000000-0000-0000-0000-000000000999',
        consumedDate: today,
        mealType: 0,
        weightGrams: 100,
      },
    });
    expect(nonExistentFoodRes.status()).toBe(404);
  });
});
