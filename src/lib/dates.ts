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
