import { getLocales } from 'expo-localization';
import { colorScheme } from 'nativewind';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { Platform, useColorScheme as useSystemColorScheme } from 'react-native';

import { changeLanguage, getDeviceLanguage, type AppLanguage } from '@/lib/i18n';
import { defaultUnitSystemForRegion } from '@/lib/units';

import { loadPreferences, savePreferences } from './preferences-storage';
import type { Preferences } from './types';

type PreferencesContextValue = Preferences & {
  /** True once persisted preferences were read from storage. */
  isHydrated: boolean;
  /** The language actually in use (resolves "system" to the device language). */
  resolvedLanguage: AppLanguage;
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function getDefaultPreferences(): Preferences {
  let region: string | null | undefined;
  try {
    region = getLocales()[0]?.regionCode;
  } catch {
    region = undefined;
  }
  return {
    language: 'system',
    theme: 'system',
    unitSystem: defaultUnitSystemForRegion(region ?? 'US'),
    hasCompletedOnboarding: false,
  };
}

export function PreferencesProvider({ children }: PropsWithChildren) {
  const [preferences, setPreferences] = useState<Preferences>(getDefaultPreferences);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadPreferences(getDefaultPreferences()).then((stored) => {
      if (cancelled) return;
      setPreferences(stored);
      setIsHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const resolvedLanguage =
    preferences.language === 'system' ? getDeviceLanguage() : preferences.language;

  useEffect(() => {
    void changeLanguage(resolvedLanguage);
  }, [resolvedLanguage]);

  const systemScheme = useSystemColorScheme();
  useEffect(() => {
    // Native: "system" hands control back to the OS appearance.
    // Web: NativeWind's class strategy needs an explicit light/dark value, so resolve it here.
    if (Platform.OS === 'web' && preferences.theme === 'system') {
      colorScheme.set(systemScheme === 'dark' ? 'dark' : 'light');
    } else {
      colorScheme.set(preferences.theme);
    }
  }, [preferences.theme, systemScheme]);

  const setPreference = useCallback<PreferencesContextValue['setPreference']>((key, value) => {
    setPreferences((current) => {
      const next = { ...current, [key]: value };
      void savePreferences(next);
      return next;
    });
  }, []);

  const value = useMemo<PreferencesContextValue>(
    () => ({ ...preferences, isHydrated, resolvedLanguage, setPreference }),
    [preferences, isHydrated, resolvedLanguage, setPreference],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences must be used inside <PreferencesProvider>');
  return context;
}
