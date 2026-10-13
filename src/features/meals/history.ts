import { diffInDays } from '@/lib/dates';

/** Free plan: today plus the 6 previous days. Also enforced server-side by RLS. */
export const FREE_HISTORY_DAYS = 7;

/**
 * Whether the diary may show `day`. Pro access must come from the server-validated
 * entitlement (useHasPro), never from a local flag.
 */
export function canViewDay(day: Date, today: Date, hasPro: boolean): boolean {
  const offset = diffInDays(today, day);
  if (offset > 0) return false; // future
  return hasPro || offset > -FREE_HISTORY_DAYS;
}
