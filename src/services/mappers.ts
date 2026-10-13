import type { Food, FoodSource } from '@/features/meals/types';
import type { Tables } from '@/types/database';

type FoodRow = Pick<
  Tables<'foods'>,
  | 'id'
  | 'name'
  | 'brand'
  | 'barcode'
  | 'calories_per_100g'
  | 'protein_per_100g'
  | 'carbs_per_100g'
  | 'fat_per_100g'
  | 'source'
  | 'created_by'
>;

export const FOOD_COLUMNS =
  'id, name, brand, barcode, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, source, created_by';

/** PostgREST may serialise numeric columns as strings; normalise to number | null. */
export function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

export function mapFood(row: FoodRow, userId: string | null): Food {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    barcode: row.barcode,
    caloriesPer100g: toNumber(row.calories_per_100g) ?? 0,
    proteinPer100g: toNumber(row.protein_per_100g),
    carbsPer100g: toNumber(row.carbs_per_100g),
    fatPer100g: toNumber(row.fat_per_100g),
    source: row.source as FoodSource,
    isOwn: row.created_by !== null && row.created_by === userId,
  };
}
