import { isAppLanguage } from '@/lib/i18n/languages';
import { readJson, storageKeys, writeJson } from '@/lib/storage';

import type { Preferences } from './types';

/** Validates a persisted (untrusted) value, falling back to defaults field by field. */
export function sanitizePreferences(raw: unknown, defaults: Preferences): Preferences {
  if (!raw || typeof raw !== 'object') return defaults;
  const value = raw as Record<string, unknown>;
  return {
    language:
      value.language === 'system' || isAppLanguage(value.language)
        ? value.language
        : defaults.language,
    theme:
      value.theme === 'light' || value.theme === 'dark' || value.theme === 'system'
        ? value.theme
        : defaults.theme,
    unitSystem:
      value.unitSystem === 'metric' || value.unitSystem === 'imperial'
        ? value.unitSystem
        : defaults.unitSystem,
    hasCompletedOnboarding:
      typeof value.hasCompletedOnboarding === 'boolean'
        ? value.hasCompletedOnboarding
        : defaults.hasCompletedOnboarding,
  };
}

export async function loadPreferences(defaults: Preferences): Promise<Preferences> {
  return sanitizePreferences(await readJson<unknown>(storageKeys.preferences), defaults);
}

export function savePreferences(preferences: Preferences): Promise<void> {
  return writeJson(storageKeys.preferences, preferences);
}
