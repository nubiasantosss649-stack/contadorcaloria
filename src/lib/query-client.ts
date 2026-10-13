import { QueryClient } from '@tanstack/react-query';

import { ServiceError } from '@/services/errors';

const NO_RETRY_CODES = new Set([
  'not_configured',
  'not_authenticated',
  'forbidden',
  'validation',
  'not_found',
  'in_use',
]);

export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ServiceError && NO_RETRY_CODES.has(error.code)) return false;
  return failureCount < 2;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: shouldRetry, staleTime: 30_000, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });
}

export const queryClient = createQueryClient();

/** Cache keys. Everything is scoped by user id so accounts never share cached data. */
export const queryKeys = {
  all: (userId: string) => ['user', userId] as const,
  account: (userId: string) => ['user', userId, 'account'] as const,
  meals: (userId: string) => ['user', userId, 'meals'] as const,
  mealsRange: (userId: string, from: string, to: string) =>
    ['user', userId, 'meals', from, to] as const,
  recentFoods: (userId: string) => ['user', userId, 'foods', 'recent'] as const,
  foodSearch: (userId: string, query: string) =>
    ['user', userId, 'foods', 'search', query] as const,
  favorites: (userId: string) => ['user', userId, 'favorites'] as const,
  weights: (userId: string, since: string) => ['user', userId, 'weights', since] as const,
  weightsAll: (userId: string) => ['user', userId, 'weights'] as const,
  entitlement: (userId: string) => ['user', userId, 'entitlement'] as const,
};
