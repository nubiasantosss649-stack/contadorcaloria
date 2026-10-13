import type { PlanId } from '@/features/subscriptions/plans';

/**
 * Purchases abstraction. Phase 1 ships only `unavailablePurchasesService`, which never charges
 * and never pretends a purchase succeeded.
 *
 * Phase 2 plan: implement this interface with `react-native-purchases` (RevenueCat), which
 * wraps Apple In-App Purchase (StoreKit) and Google Play Billing. That requires a development
 * build (not Expo Go), the public SDK keys in .env and products configured in both stores.
 */
export type PurchaseOutcome =
  | { status: 'unavailable' }
  | { status: 'cancelled' }
  | { status: 'purchased'; planId: PlanId }
  | { status: 'error'; message: string };

export type PurchasesService = {
  isAvailable: boolean;
  purchase: (planId: PlanId) => Promise<PurchaseOutcome>;
  restore: () => Promise<PurchaseOutcome>;
};

export const unavailablePurchasesService: PurchasesService = {
  isAvailable: false,
  purchase: async () => ({ status: 'unavailable' }),
  restore: async () => ({ status: 'unavailable' }),
};

export const purchasesService: PurchasesService = unavailablePurchasesService;
