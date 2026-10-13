export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;
export type MealType = (typeof MEAL_TYPES)[number];

/** Shape of a logged food entry (persisted in Supabase from Phase 2 on). */
export type FoodEntry = {
  id: string;
  mealType: MealType;
  name: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  loggedAt: string;
};

export function mealTypeForHour(hour: number): MealType {
  if (hour >= 5 && hour < 11) return 'breakfast';
  if (hour >= 11 && hour < 16) return 'lunch';
  if (hour >= 18 && hour < 22) return 'dinner';
  return 'snack';
}
