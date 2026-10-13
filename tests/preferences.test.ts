import { sanitizePreferences } from '@/features/preferences/preferences-storage';
import type { Preferences } from '@/features/preferences/types';
import { greetingKeyForHour } from '@/hooks/use-greeting-key';
import { mealTypeForHour } from '@/features/meals/types';

const defaults: Preferences = {
  language: 'system',
  theme: 'system',
  unitSystem: 'imperial',
  hasCompletedOnboarding: false,
};

describe('sanitizePreferences', () => {
  it('returns defaults for invalid input', () => {
    expect(sanitizePreferences(null, defaults)).toEqual(defaults);
    expect(sanitizePreferences('oops', defaults)).toEqual(defaults);
  });

  it('keeps valid fields and drops invalid ones', () => {
    expect(
      sanitizePreferences(
        { language: 'pt-BR', theme: 'neon', unitSystem: 'metric', hasCompletedOnboarding: 'yes' },
        defaults,
      ),
    ).toEqual({
      language: 'pt-BR',
      theme: 'system',
      unitSystem: 'metric',
      hasCompletedOnboarding: false,
    });
  });
});

describe('time based helpers', () => {
  it('greets by time of day', () => {
    expect(greetingKeyForHour(7)).toBe('home.greetingMorning');
    expect(greetingKeyForHour(14)).toBe('home.greetingAfternoon');
    expect(greetingKeyForHour(22)).toBe('home.greetingEvening');
    expect(greetingKeyForHour(3)).toBe('home.greetingEvening');
  });

  it('suggests a meal type by hour', () => {
    expect(mealTypeForHour(8)).toBe('breakfast');
    expect(mealTypeForHour(12)).toBe('lunch');
    expect(mealTypeForHour(19)).toBe('dinner');
    expect(mealTypeForHour(16)).toBe('snack');
  });
});
