import type { Food } from './types';

/**
 * Hand-off between the "create food" screen and the "add meal" screen it was opened from:
 * the newly created food is picked up when add-meal regains focus.
 */
let pending: Food | null = null;

export function setPendingFood(food: Food): void {
  pending = food;
}

export function takePendingFood(): Food | null {
  const food = pending;
  pending = null;
  return food;
}
