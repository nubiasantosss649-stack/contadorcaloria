export type GreetingKey =
  'home.greetingMorning' | 'home.greetingAfternoon' | 'home.greetingEvening';

export function greetingKeyForHour(hour: number): GreetingKey {
  if (hour >= 5 && hour < 12) return 'home.greetingMorning';
  if (hour >= 12 && hour < 18) return 'home.greetingAfternoon';
  return 'home.greetingEvening';
}

export function useGreetingKey(now: Date = new Date()): GreetingKey {
  return greetingKeyForHour(now.getHours());
}
