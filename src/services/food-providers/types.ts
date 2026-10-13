/**
 * External food databases (prepared for a later phase).
 *
 * Plan: an import job / Edge Function running with the service role searches these APIs and
 * upserts results into `public.foods` (source + source_id, unique), so the shared catalogue
 * grows without exposing API keys in the app. Values that the source does not provide stay
 * `null` — they are never estimated.
 */
export type ExternalFood = {
  source: 'usda' | 'open_food_facts';
  sourceId: string;
  name: string;
  brand: string | null;
  barcode: string | null;
  caloriesPer100g: number;
  proteinPer100g: number | null;
  carbsPer100g: number | null;
  fatPer100g: number | null;
};

export type FoodProvider = {
  id: ExternalFood['source'];
  search: (query: string, signal?: AbortSignal) => Promise<ExternalFood[]>;
};

export const KJ_PER_KCAL = 4.184;

export function cleanNumber(value: unknown, max: number): number | null {
  const n = typeof value === 'string' ? Number(value) : value;
  if (typeof n !== 'number' || !Number.isFinite(n) || n < 0 || n > max) return null;
  return Math.round(n * 10) / 10;
}

export function cleanText(value: unknown, maxLength = 120): string | null {
  if (typeof value !== 'string') return null;
  const text = value.replace(/\s+/g, ' ').trim();
  return text ? text.slice(0, maxLength) : null;
}
