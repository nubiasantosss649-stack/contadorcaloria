import type { Nutrients } from '@/lib/nutrition';

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export type FoodSource = 'user' | 'usda' | 'open_food_facts';

export type Food = {
  id: string;
  name: string;
  brand: string | null;
  barcode: string | null;
  /** Per 100 g. Macros are `null` when unknown — never guessed. */
  caloriesPer100g: number;
  proteinPer100g: number | null;
  carbsPer100g: number | null;
  fatPer100g: number | null;
  source: FoodSource;
  isOwn: boolean;
};

export type MealItem = {
  id: string;
  entryId: string;
  food: Food;
  grams: number;
  nutrients: Nutrients;
};

export type MealEntry = {
  id: string;
  mealType: MealType;
  consumedAt: string;
  items: MealItem[];
};

export type FavoriteMeal = {
  id: string;
  name: string;
  mealType: MealType | null;
  items: { food: Food; grams: number }[];
};

export type NewFoodInput = {
  name: string;
  brand: string | null;
  barcode: string | null;
  caloriesPer100g: number;
  proteinPer100g: number | null;
  carbsPer100g: number | null;
  fatPer100g: number | null;
};

export type PortionInput = { foodId: string; grams: number };

export function mealTypeForHour(hour: number): MealType {
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 16) return 'lunch';
  if (hour >= 18 && hour < 22) return 'dinner';
  return 'snack';
}

export function isMealType(value: unknown): value is MealType {
  return typeof value === 'string' && (MEAL_TYPES as readonly string[]).includes(value);
}
