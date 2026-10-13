import { useSavePreferences, useUpdateProfile } from '@/features/account/hooks';
import { useAuth } from '@/features/auth/auth-provider';
import { getDeviceLanguage } from '@/lib/i18n';
import type { UnitSystem } from '@/lib/units';

import { usePreferences } from './preferences-provider';
import type { LanguagePreference, ThemePreference } from './types';

/**
 * Preference setters that update the device immediately and, when signed in, persist the
 * change to the account (profiles.language / user_preferences) so other devices follow.
 */
export function useSyncedPreferences() {
  const preferences = usePreferences();
  const { session, isPreview } = useAuth();
  const savePreferences = useSavePreferences();
  const updateProfile = useUpdateProfile();
  const remote = Boolean(session) && !isPreview;

  return {
    ...preferences,
    setTheme(theme: ThemePreference) {
      preferences.setPreference('theme', theme);
      if (remote) savePreferences.mutate({ theme });
    },
    setUnitSystem(unitSystem: UnitSystem) {
      preferences.setPreference('unitSystem', unitSystem);
      if (remote) savePreferences.mutate({ unitSystem });
    },
    setLanguage(language: LanguagePreference) {
      preferences.setPreference('language', language);
      if (remote)
        updateProfile.mutate({ language: language === 'system' ? getDeviceLanguage() : language });
    },
    syncError: savePreferences.error ?? updateProfile.error,
  };
}
