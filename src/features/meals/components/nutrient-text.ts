import type { TFunction } from 'i18next';

/** "12.5 g" or "—" when unknown (never shown as 0). */
export function formatGrams(value: number | null, t: TFunction, locale: string): string {
  if (value === null) return '—';
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)} ${t('common.grams')}`;
}

export function formatKcal(value: number, t: TFunction, locale: string): string {
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Math.round(value))} ${t('common.kcal')}`;
}
