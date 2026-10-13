import type { Food, NewFoodInput } from '@/features/meals/types';

import { requireUser } from './client';
import { unwrap } from './errors';
import { FOOD_COLUMNS, mapFood } from './mappers';

/** Escapes LIKE wildcards so user input is matched literally. */
export function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}

export const foodsService = {
  /** Searches the shared catalogue and the user's own foods (RLS limits visibility). */
  async search(query: string, limit = 30): Promise<Food[]> {
    const { client, userId } = await requireUser();
    const term = query.trim().slice(0, 80);
    if (term.length < 2) return [];
    let request = client.from('foods').select(FOOD_COLUMNS).limit(limit).order('name');
    request = /^\d{6,14}$/.test(term)
      ? request.eq('barcode', term)
      : request.ilike('name', `%${escapeLike(term)}%`);
    const rows = unwrap(await request);
    return rows.map((row) => mapFood(row, userId));
  },

  /** Foods the user logged most recently (deduplicated). */
  async recent(limit = 15): Promise<Food[]> {
    const { client, userId } = await requireUser();
    const rows = unwrap(
      await client
        .from('meal_items')
        .select(`created_at, foods(${FOOD_COLUMNS})`)
        .order('created_at', { ascending: false })
        .limit(100),
    );
    const seen = new Set<string>();
    const foods: Food[] = [];
    for (const row of rows) {
      const food = row.foods;
      if (!food || seen.has(food.id)) continue;
      seen.add(food.id);
      foods.push(mapFood(food, userId));
      if (foods.length >= limit) break;
    }
    return foods;
  },

  async create(input: NewFoodInput): Promise<Food> {
    const { client, userId } = await requireUser();
    const row = unwrap(
      await client
        .from('foods')
        .insert({
          name: input.name.trim(),
          brand: input.brand?.trim() || null,
          barcode: input.barcode?.trim() || null,
          calories_per_100g: input.caloriesPer100g,
          protein_per_100g: input.proteinPer100g,
          carbs_per_100g: input.carbsPer100g,
          fat_per_100g: input.fatPer100g,
          source: 'user',
          created_by: userId,
        })
        .select(FOOD_COLUMNS)
        .single(),
    );
    return mapFood(row, userId);
  },
};
