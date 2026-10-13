import { formatPrice, getPlan, PLANS, yearlySavingsPercent } from '@/features/subscriptions/plans';
import { unavailablePurchasesService } from '@/services/purchases-service';

describe('subscription plans', () => {
  it('exposes the three demonstrative plans', () => {
    expect(PLANS.map((plan) => [plan.id, plan.displayPriceUsd])).toEqual([
      ['free', 0],
      ['pro_monthly', 9.99],
      ['pro_yearly', 79.99],
    ]);
    expect(getPlan('free').productIds).toEqual({ ios: null, android: null });
  });

  it('computes the yearly savings', () => {
    expect(yearlySavingsPercent(9.99, 79.99)).toBe(33);
    expect(yearlySavingsPercent(0, 10)).toBe(0);
  });

  it('formats prices for the current locale', () => {
    expect(formatPrice(9.99, 'en-US')).toBe('$9.99');
    expect(formatPrice(9.99, 'pt-BR').replace(/\s/g, ' ')).toBe('US$ 9,99');
  });

  it('never simulates a purchase in Phase 1', async () => {
    expect(unavailablePurchasesService.isAvailable).toBe(false);
    await expect(unavailablePurchasesService.purchase('pro_yearly')).resolves.toEqual({
      status: 'unavailable',
    });
    await expect(unavailablePurchasesService.restore()).resolves.toEqual({ status: 'unavailable' });
  });
});
