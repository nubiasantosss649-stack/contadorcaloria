import type { Account } from '@/features/account/types';
import type { Food, MealEntry, MealType, PortionInput } from '@/features/meals/types';
import { calculateNutrients } from '@/lib/nutrition';

import { TEST_USER_ID } from './mocks';

export const yogurt: Food = {
  id: 'food-yogurt',
  name: 'Greek yogurt',
  brand: null,
  barcode: null,
  caloriesPer100g: 200,
  proteinPer100g: 10,
  carbsPer100g: 4,
  fatPer100g: null,
  source: 'user',
  isOwn: true,
};

export function makeAccount(overrides: Partial<Account> = {}): Account {
  return {
    profile: {
      id: TEST_USER_ID,
      displayName: 'Ana',
      email: 'ana@example.com',
      language: 'en-US',
      country: 'US',
      onboardingCompletedAt: '2026-10-01T00:00:00Z',
      createdAt: '2026-10-01T00:00:00Z',
    },
    preferences: { unitSystem: 'metric', theme: 'system', notificationPreferences: {} },
    health: null,
    goals: {
      dailyCalorieTarget: 2000,
      proteinTarget: 125,
      carbTarget: 225,
      fatTarget: 67,
      source: 'manual',
      updatedAt: '2026-10-01T00:00:00Z',
    },
    latestWeight: null,
    ...overrides,
  };
}

/**
 * In-memory stand-in for the meals tables. Nutrients are recalculated like the database
 * trigger does, so screens can be tested end-to-end through the real hooks.
 */
export function createFakeMeals(foods: Food[] = [yogurt]) {
  let entries: MealEntry[] = [];
  let seq = 0;
  const nutrientsFor = (food: Food, grams: number) =>
    calculateNutrients(
      {
        calories: food.caloriesPer100g,
        protein: food.proteinPer100g,
        carbs: food.carbsPer100g,
        fat: food.fatPer100g,
      },
      grams,
    );
  return {
    get entries() {
      return entries;
    },
    listRange: jest.fn(async (_from: string, _to: string) => structuredClone(entries)),
    addItems: jest.fn(
      async (mealType: MealType, consumedAt: string, items: readonly PortionInput[]) => {
        const entryId = `entry-${++seq}`;
        entries = [
          ...entries,
          {
            id: entryId,
            mealType,
            consumedAt,
            items: items.map((item) => {
              const food = foods.find((f) => f.id === item.foodId)!;
              return {
                id: `item-${++seq}`,
                entryId,
                food,
                grams: item.grams,
                nutrients: nutrientsFor(food, item.grams),
              };
            }),
          },
        ];
      },
    ),
    updateItemQuantity: jest.fn(async (itemId: string, grams: number) => {
      entries = entries.map((entry) => ({
        ...entry,
        items: entry.items.map((item) =>
          item.id === itemId ? { ...item, grams, nutrients: nutrientsFor(item.food, grams) } : item,
        ),
      }));
    }),
    deleteItem: jest.fn(async (itemId: string) => {
      entries = entries
        .map((entry) => ({ ...entry, items: entry.items.filter((item) => item.id !== itemId) }))
        .filter((entry) => entry.items.length > 0);
    }),
    deleteEntry: jest.fn(),
  };
}
