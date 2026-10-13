/**
 * Plan catalogue used by the paywall UI.
 *
 * IMPORTANT: `displayPriceUsd` values are ILLUSTRATIVE ONLY (Phase 1). When RevenueCat is
 * integrated, prices, currency and intro offers must come from the store products
 * (`StoreProduct.priceString`) — never from these constants.
 */
export type PlanId = 'free' | 'pro_monthly' | 'pro_yearly';
export type BillingPeriod = 'none' | 'month' | 'year';

export type Plan = {
  id: PlanId;
  period: BillingPeriod;
  displayPriceUsd: number;
  /** Store product identifiers to configure in App Store Connect / Google Play / RevenueCat. */
  productIds: { ios: string | null; android: string | null };
  highlighted: boolean;
};

export const RC_ENTITLEMENT_PRO = 'pro';

export const PLANS: readonly Plan[] = [
  {
    id: 'free',
    period: 'none',
    displayPriceUsd: 0,
    productIds: { ios: null, android: null },
    highlighted: false,
  },
  {
    id: 'pro_monthly',
    period: 'month',
    displayPriceUsd: 9.99,
    productIds: { ios: 'caloria_pro_monthly', android: 'caloria_pro:monthly' },
    highlighted: false,
  },
  {
    id: 'pro_yearly',
    period: 'year',
    displayPriceUsd: 79.99,
    productIds: { ios: 'caloria_pro_yearly', android: 'caloria_pro:yearly' },
    highlighted: true,
  },
] as const;

export function getPlan(id: PlanId): Plan {
  const plan = PLANS.find((candidate) => candidate.id === id);
  if (!plan) throw new Error(`Unknown plan: ${id}`);
  return plan;
}

/** Percentage saved by paying yearly instead of 12 monthly payments (rounded down). */
export function yearlySavingsPercent(monthlyPrice: number, yearlyPrice: number): number {
  if (monthlyPrice <= 0) return 0;
  const fullYear = monthlyPrice * 12;
  return Math.max(0, Math.floor(((fullYear - yearlyPrice) / fullYear) * 100));
}

export function formatPrice(amount: number, locale: string, currency = 'USD'): string {
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  } catch {
    return `US$ ${amount.toFixed(2)}`;
  }
}
