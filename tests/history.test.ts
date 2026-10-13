import { canViewDay } from '@/features/meals/history';
import { addDays } from '@/lib/dates';

describe('history window', () => {
  const today = new Date(2026, 9, 13, 15, 0);

  it('Free plan shows today and the previous 6 days only', () => {
    expect(canViewDay(today, today, false)).toBe(true);
    expect(canViewDay(addDays(today, -6), today, false)).toBe(true);
    expect(canViewDay(addDays(today, -7), today, false)).toBe(false);
  });

  it('Pro (server-validated) can see the full history', () => {
    expect(canViewDay(addDays(today, -400), today, true)).toBe(true);
  });

  it('never shows future days', () => {
    expect(canViewDay(addDays(today, 1), today, true)).toBe(false);
  });
});
