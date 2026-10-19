import { test, expect } from '@playwright/test';
import { createAndActivateUser, generateRandomUser } from './api-helpers';

test.describe('Moduł Bazy Produktów Spożywczych (API Integration)', () => {
  let userToken: string;
  let userHeader: { Authorization: string };

  test.beforeAll(async ({ request }) => {
    const { token } = await createAndActivateUser(request);
    userToken = token;
    userHeader = { Authorization: `Bearer ${userToken}` };
  });

  test('TC-FOOD-001: Wyszukiwanie produktów z bazy z filtrowaniem po kategorii', async ({ request }) => {
    // 1. Wyszukanie produktu domyślnego z bazy (np. Jajko)
    const searchRes = await request.get('/api/foods?query=Jajko', {
      headers: userHeader,
    });
    expect(searchRes.status()).toBe(200);

    const foods = await searchRes.json();
    expect(Array.isArray(foods)).toBe(true);
    expect(foods.length).toBeGreaterThan(0);

    const eggItem = foods.find((f: any) => f.name.toLowerCase().includes('jajko kurze całe'));
    expect(eggItem).toBeDefined();
    expect(eggItem.caloriesPer100g).toBeCloseTo(143, 0);
    expect(eggItem.proteinPer100g).toBeCloseTo(12.6, 1);
    expect(eggItem.isCustom).toBe(false);

    // 2. Filtrowanie po kategorii "Tłuszcze i Oleje"
    const catRes = await request.get('/api/foods?category=Tłuszcze i Oleje', {
      headers: userHeader,
    });
    expect(catRes.status()).toBe(200);
    const catFoods = await catRes.json();
    expect(catFoods.length).toBeGreaterThan(0);
    for (const food of catFoods) {
      expect(food.category).toBe('Tłuszcze i Oleje');
    }
  });

  test('TC-FOOD-002: Utworzenie własnego produktu spożywczego i izolacja danych użytkowników', async ({ request }) => {
    const customFood = {
      name: `Baton proteinowy test-${Date.now()}`,
      brand: 'Testowa Marka',
      category: 'Odżywki i Przekąski',
      caloriesPer100g: 380,
      proteinPer100g: 32.0,
      carbsPer100g: 28.0,
      fatPer100g: 12.0,
    };

    // 1. Dodanie własnego produktu
    const createRes = await request.post('/api/foods', {
      headers: userHeader,
      data: customFood,
    });
    expect(createRes.status()).toBe(200);

    const created = await createRes.json();
    expect(created.id).toBeDefined();
    expect(created.name).toBe(customFood.name);
    expect(created.brand).toBe(customFood.brand);
    expect(created.isCustom).toBe(true);
    expect(created.caloriesPer100g).toBe(380);

    // 2. Wyszukanie własnego produktu przez twórcę
    const searchRes = await request.get(`/api/foods?query=${encodeURIComponent(customFood.name)}`, {
      headers: userHeader,
    });
    expect(searchRes.status()).toBe(200);
    const searchResults = await searchRes.json();
    expect(searchResults.some((f: any) => f.id === created.id && f.isCustom === true)).toBe(true);

    // 3. Weryfikacja izolacji danych: inny użytkownik NIE widzi produktu customowego
    const otherUser = await createAndActivateUser(request, generateRandomUser('isolated'));
    const otherRes = await request.get(`/api/foods?query=${encodeURIComponent(customFood.name)}`, {
      headers: { Authorization: `Bearer ${otherUser.token}` },
    });
    expect(otherRes.status()).toBe(200);
    const otherResults = await otherRes.json();
    expect(otherResults.some((f: any) => f.id === created.id)).toBe(false);
  });

  test('Negatywny: Walidacja parametrów tworzenia produktu (brak nazwy, ujemne wartości)', async ({ request }) => {
    // 1. Zbyt krótka / brak nazwy
    const invalidNameRes = await request.post('/api/foods', {
      headers: userHeader,
      data: {
        name: 'A', // MinLength(2)
        category: 'Inne',
        caloriesPer100g: 200,
        proteinPer100g: 10,
        carbsPer100g: 20,
        fatPer100g: 5,
      },
    });
    expect(invalidNameRes.status()).toBe(400);

    // 2. Wartości makro poza dozwolonym zakresem Range(0, 100)
    const invalidMacroRes = await request.post('/api/foods', {
      headers: userHeader,
      data: {
        name: 'Niepoprawny produkt',
        category: 'Inne',
        caloriesPer100g: 200,
        proteinPer100g: 150, // Max 100
        carbsPer100g: -5,   // Min 0
        fatPer100g: 10,
      },
    });
    expect(invalidMacroRes.status()).toBe(400);
  });
});

