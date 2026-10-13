/**
 * Nutrition math shared by the UI and mirrored by the database trigger
 * (public.nutrient_for_quantity): value_per_100g × grams / 100, rounded to 1 decimal.
 * `null` means "unknown" and is never turned into 0.
 */
export type NutrientsPer100g = {
  calories: number;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
};

export type Nutrients = {
  calories: number;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
};

/** Round half away from zero to `decimals` places, avoiding binary float artefacts (1.005 → 1.01). */
export function round(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  const scaled = Math.abs(value) * factor;
  const rounded = Math.round(Number(scaled.toPrecision(12)));
  return (Math.sign(value) * rounded) / factor;
}

export function nutrientForQuantity(per100g: number, grams: number): number;
export function nutrientForQuantity(per100g: number | null, grams: number): number | null;
export function nutrientForQuantity(per100g: number | null, grams: number): number | null {
  if (per100g === null || !Number.isFinite(per100g) || !Number.isFinite(grams)) return null;
  return round((per100g * grams) / 100, 1);
}

export function calculateNutrients(food: NutrientsPer100g, grams: number): Nutrients {
  return {
    calories: nutrientForQuantity(food.calories, grams),
    protein: nutrientForQuantity(food.protein, grams),
    carbs: nutrientForQuantity(food.carbs, grams),
    fat: nutrientForQuantity(food.fat, grams),
  };
}

export type NutrientTotals = Nutrients & {
  /** True when at least one item had an unknown value for that macro. */
  incomplete: { protein: boolean; carbs: boolean; fat: boolean };
};

/** Sums items; unknown macros count as 0 in the total but are flagged as incomplete. */
export function sumNutrients(items: readonly Nutrients[]): NutrientTotals {
  const total: NutrientTotals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    incomplete: { protein: false, carbs: false, fat: false },
  };
  for (const item of items) {
    total.calories += item.calories;
    for (const key of ['protein', 'carbs', 'fat'] as const) {
      const value = item[key];
      if (value === null) total.incomplete[key] = true;
      else total[key] = (total[key] ?? 0) + value;
    }
  }
  return {
    ...total,
    calories: round(total.calories, 1),
    protein: round(total.protein ?? 0, 1),
    carbs: round(total.carbs ?? 0, 1),
    fat: round(total.fat ?? 0, 1),
  };
}

/** Remaining calories for the day; negative when over target. `null` when no target. */
export function remainingCalories(target: number | null, consumed: number): number | null {
  return target === null ? null : Math.round(target - consumed);
}

/** 0..1 progress for rings and bars (0 when there is no target). */
export function progressRatio(consumed: number, target: number | null | undefined): number {
  if (!target || target <= 0) return 0;
  return Math.min(1, Math.max(0, consumed / target));
}

/** Validation for user-entered foods; returns a translation key or null. */
export type FoodValidationError =
  | 'foods.errors.nameRequired'
  | 'foods.errors.caloriesRequired'
  | 'foods.errors.caloriesRange'
  | 'foods.errors.macroRange'
  | 'foods.errors.macrosExceed';

export function validateFoodPer100g(input: {
  name: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}): FoodValidationError | null {
  if (!input.name.trim()) return 'foods.errors.nameRequired';
  if (input.calories === null) return 'foods.errors.caloriesRequired';
  if (input.calories < 0 || input.calories > 900) return 'foods.errors.caloriesRange';
  const macros = [input.protein, input.carbs, input.fat];
  if (macros.some((m) => m !== null && (m < 0 || m > 100))) return 'foods.errors.macroRange';
  if (macros.reduce<number>((sum, m) => sum + (m ?? 0), 0) > 100.5)
    return 'foods.errors.macrosExceed';
  return null;
}

export const MAX_PORTION_GRAMS = 5000;

export function isValidPortion(grams: number | null): grams is number {
  return grams !== null && Number.isFinite(grams) && grams > 0 && grams <= MAX_PORTION_GRAMS;
}

/** Parses user input such as "150", "12,5" or "12.5"; returns null for empty/invalid text. */
export function parseDecimal(text: string): number | null {
  const normalized = text.trim().replace(',', '.');
  if (!normalized || !/^\d*\.?\d+$|^\d+\.$/.test(normalized)) return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}
