import type { AppLanguage } from '@/lib/i18n/languages';
import type { UnitSystem } from '@/lib/units';

export type ThemePreference = 'system' | 'light' | 'dark';
export type LanguagePreference = AppLanguage | 'system';

export type Preferences = {
  language: LanguagePreference;
  theme: ThemePreference;
  unitSystem: UnitSystem;
  hasCompletedOnboarding: boolean;
};
