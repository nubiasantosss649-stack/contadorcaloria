import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useUserId } from '@/features/account/hooks';
import { dayRange } from '@/lib/dates';
import { sumNutrients } from '@/lib/nutrition';
import { queryKeys } from '@/lib/query-client';
import { foodsService } from '@/services/foods-service';
import { favoritesService, mealsService } from '@/services/meals-service';

import {
  MEAL_TYPES,
  type MealEntry,
  type MealType,
  type NewFoodInput,
  type PortionInput,
} from './types';

export function useMealsRange(from: string, to: string) {
  const userId = useUserId();
  return useQuery({
    queryKey: queryKeys.mealsRange(userId ?? 'none', from, to),
    queryFn: () => mealsService.listRange(from, to),
    enabled: userId !== null,
  });
}

export function useDayMeals(date: Date) {
  const { from, to } = dayRange(date);
  return useMealsRange(from, to);
}

/** Totals for the day plus a per-meal summary, derived from the cached entries. */
export function useDaySummary(entries: readonly MealEntry[] | undefined) {
  return useMemo(() => summarizeDay(entries ?? []), [entries]);
}

export function summarizeDay(entries: readonly MealEntry[]) {
  const items = entries.flatMap((entry) => entry.items);
  const byMeal = Object.fromEntries(
    MEAL_TYPES.map((meal) => {
      const mealItems = entries.filter((e) => e.mealType === meal).flatMap((e) => e.items);
      return [meal, { items: mealItems, totals: sumNutrients(mealItems.map((i) => i.nutrients)) }];
    }),
  ) as Record<MealType, { items: MealEntry['items']; totals: ReturnType<typeof sumNutrients> }>;
  return { totals: sumNutrients(items.map((i) => i.nutrients)), byMeal, itemCount: items.length };
}

/** Invalidates every cached meal range, so dashboard, diary and history refresh together. */
function useInvalidateMeals() {
  const userId = useUserId() ?? 'none';
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.meals(userId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.recentFoods(userId) }),
    ]);
}

export function useAddMealItems() {
  const invalidate = useInvalidateMeals();
  return useMutation({
    mutationFn: (input: { mealType: MealType; consumedAt: string; items: PortionInput[] }) =>
      mealsService.addItems(input.mealType, input.consumedAt, input.items),
    onSuccess: invalidate,
  });
}

export function useUpdateMealItem() {
  const invalidate = useInvalidateMeals();
  return useMutation({
    mutationFn: (input: { itemId: string; grams: number }) =>
      mealsService.updateItemQuantity(input.itemId, input.grams),
    onSuccess: invalidate,
  });
}

export function useDeleteMealItem() {
  const invalidate = useInvalidateMeals();
  return useMutation({
    mutationFn: (input: { itemId: string; entryId: string }) =>
      mealsService.deleteItem(input.itemId, input.entryId),
    onSuccess: invalidate,
  });
}

export function useFoodSearch(query: string) {
  const userId = useUserId();
  const term = query.trim();
  return useQuery({
    queryKey: queryKeys.foodSearch(userId ?? 'none', term.toLowerCase()),
    queryFn: () => foodsService.search(term),
    enabled: userId !== null && term.length >= 2,
  });
}

export function useRecentFoods() {
  const userId = useUserId();
  return useQuery({
    queryKey: queryKeys.recentFoods(userId ?? 'none'),
    queryFn: () => foodsService.recent(),
    enabled: userId !== null,
  });
}

export function useCreateFood() {
  const userId = useUserId() ?? 'none';
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: NewFoodInput) => foodsService.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['user', userId, 'foods'] }),
  });
}

export function useFavorites() {
  const userId = useUserId();
  return useQuery({
    queryKey: queryKeys.favorites(userId ?? 'none'),
    queryFn: favoritesService.list,
    enabled: userId !== null,
  });
}

export function useCreateFavorite() {
  const userId = useUserId() ?? 'none';
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; mealType: MealType | null; items: PortionInput[] }) =>
      favoritesService.create(input.name, input.mealType, input.items),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.favorites(userId) }),
  });
}

export function useDeleteFavorite() {
  const userId = useUserId() ?? 'none';
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => favoritesService.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.favorites(userId) }),
  });
}
