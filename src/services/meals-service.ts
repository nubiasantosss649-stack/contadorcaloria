import type { FavoriteMeal, MealEntry, MealType, PortionInput } from '@/features/meals/types';
import { dayRange } from '@/lib/dates';

import { requireUser } from './client';
import { ServiceError, toServiceError, unwrap } from './errors';
import { FOOD_COLUMNS, mapFood, toNumber } from './mappers';

const ENTRY_SELECT = `id, meal_type, consumed_at,
  meal_items(id, meal_entry_id, quantity_grams, calculated_calories, calculated_protein,
             calculated_carbs, calculated_fat, created_at, foods(${FOOD_COLUMNS}))`;

function validatePortions(items: readonly PortionInput[]): void {
  if (items.length === 0) throw new ServiceError('validation', 'no items');
  for (const item of items) {
    if (!(item.grams > 0 && item.grams <= 5000))
      throw new ServiceError('validation', 'invalid grams');
  }
}

export const mealsService = {
  /** Entries whose consumed_at falls in [from, to). Server RLS also enforces the plan's window. */
  async listRange(from: string, to: string): Promise<MealEntry[]> {
    const { client, userId } = await requireUser();
    const rows = unwrap(
      await client
        .from('meal_entries')
        .select(ENTRY_SELECT)
        .gte('consumed_at', from)
        .lt('consumed_at', to)
        .order('consumed_at', { ascending: true }),
    );
    return rows.map((row) => ({
      id: row.id,
      mealType: row.meal_type,
      consumedAt: row.consumed_at,
      items: [...row.meal_items]
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .filter((item) => item.foods !== null)
        .map((item) => ({
          id: item.id,
          entryId: item.meal_entry_id,
          grams: toNumber(item.quantity_grams) ?? 0,
          // Values come from the database trigger (single source of truth).
          nutrients: {
            calories: toNumber(item.calculated_calories) ?? 0,
            protein: toNumber(item.calculated_protein),
            carbs: toNumber(item.calculated_carbs),
            fat: toNumber(item.calculated_fat),
          },
          food: mapFood(item.foods!, userId),
        })),
    }));
  },

  listDay(date: Date): Promise<MealEntry[]> {
    const { from, to } = dayRange(date);
    return mealsService.listRange(from, to);
  },

  /**
   * Adds portions to the meal of `mealType` on the given day, reusing that day's entry when it
   * exists so the diary shows one block per meal.
   */
  async addItems(
    mealType: MealType,
    consumedAt: string,
    items: readonly PortionInput[],
  ): Promise<void> {
    validatePortions(items);
    const { client } = await requireUser();
    const { from, to } = dayRange(new Date(consumedAt));
    const existing = unwrap(
      await client
        .from('meal_entries')
        .select('id')
        .eq('meal_type', mealType)
        .gte('consumed_at', from)
        .lt('consumed_at', to)
        .limit(1),
    );
    let entryId = existing[0]?.id;
    let created = false;
    if (!entryId) {
      const entry = unwrap(
        await client
          .from('meal_entries')
          .insert({ meal_type: mealType, consumed_at: consumedAt })
          .select('id')
          .single(),
      );
      entryId = entry.id;
      created = true;
    }
    const { error } = await client.from('meal_items').insert(
      items.map((item) => ({
        meal_entry_id: entryId,
        food_id: item.foodId,
        quantity_grams: item.grams,
      })),
    );
    if (error) {
      // Compensate so we don't leave an empty meal behind.
      if (created) await client.from('meal_entries').delete().eq('id', entryId);
      throw toServiceError(error);
    }
  },

  async updateItemQuantity(itemId: string, grams: number): Promise<void> {
    validatePortions([{ foodId: '', grams }]);
    const { client } = await requireUser();
    unwrap(
      await client
        .from('meal_items')
        .update({ quantity_grams: grams })
        .eq('id', itemId)
        .select('id')
        .single(),
    );
  },

  /** Deletes an item; removes the meal entry too when it becomes empty. */
  async deleteItem(itemId: string, entryId: string): Promise<void> {
    const { client } = await requireUser();
    unwrap(await client.from('meal_items').delete().eq('id', itemId).select('id'));
    const remaining = unwrap(
      await client.from('meal_items').select('id').eq('meal_entry_id', entryId).limit(1),
    );
    if (remaining.length === 0) {
      unwrap(await client.from('meal_entries').delete().eq('id', entryId).select('id'));
    }
  },

  async deleteEntry(entryId: string): Promise<void> {
    const { client } = await requireUser();
    unwrap(await client.from('meal_entries').delete().eq('id', entryId).select('id'));
  },
};

export const favoritesService = {
  async list(): Promise<FavoriteMeal[]> {
    const { client, userId } = await requireUser();
    const rows = unwrap(
      await client
        .from('favorite_meals')
        .select(`id, name, meal_type, favorite_meal_items(quantity_grams, foods(${FOOD_COLUMNS}))`)
        .order('created_at', { ascending: false }),
    );
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      mealType: row.meal_type,
      items: row.favorite_meal_items
        .filter((item) => item.foods !== null)
        .map((item) => ({
          food: mapFood(item.foods!, userId),
          grams: toNumber(item.quantity_grams) ?? 0,
        })),
    }));
  },

  async create(
    name: string,
    mealType: MealType | null,
    items: readonly PortionInput[],
  ): Promise<void> {
    validatePortions(items);
    const trimmed = name.trim();
    if (!trimmed) throw new ServiceError('validation', 'name required');
    const { client } = await requireUser();
    const favorite = unwrap(
      await client
        .from('favorite_meals')
        .insert({ name: trimmed.slice(0, 80), meal_type: mealType })
        .select('id')
        .single(),
    );
    const { error } = await client.from('favorite_meal_items').insert(
      items.map((item) => ({
        favorite_meal_id: favorite.id,
        food_id: item.foodId,
        quantity_grams: item.grams,
      })),
    );
    if (error) {
      await client.from('favorite_meals').delete().eq('id', favorite.id);
      throw toServiceError(error);
    }
  },

  async remove(id: string): Promise<void> {
    const { client } = await requireUser();
    unwrap(await client.from('favorite_meals').delete().eq('id', id).select('id'));
  },
};
