export function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** Whole calendar days between two dates (b - a), ignoring time of day. */
export function diffInDays(a: Date, b: Date): number {
  const ms = startOfDay(b).getTime() - startOfDay(a).getTime();
  return Math.round(ms / 86_400_000);
}

export function formatLongDate(date: Date, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return date.toDateString();
  }
}

/** [start of local day, start of next local day) as ISO strings, for timestamptz queries. */
export function dayRange(date: Date): { from: string; to: string } {
  const start = startOfDay(date);
  return { from: start.toISOString(), to: addDays(start, 1).toISOString() };
}

/** Local calendar key "YYYY-MM-DD" (used for cache keys and grouping). */
export function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromDayKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
}

/**
 * Timestamp used when logging food for `day`: now when it is today, otherwise noon of that day
 * (so the entry stays inside the day in every timezone offset change).
 */
export function consumedAtFor(day: Date, now: Date = new Date()): string {
  if (diffInDays(now, day) === 0) return now.toISOString();
  const noon = startOfDay(day);
  noon.setHours(12);
  return noon.toISOString();
}

export function formatShortDate(date: Date, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(date);
  } catch {
    return date.toDateString();
  }
}
