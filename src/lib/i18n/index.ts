import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enUS from '@/locales/en-US';
import es from '@/locales/es';
import ptBR from '@/locales/pt-BR';

import { DEFAULT_LANGUAGE, resolveFromDeviceTags, type AppLanguage } from './languages';

export const resources = {
  'en-US': { translation: enUS },
  'pt-BR': { translation: ptBR },
  es: { translation: es },
} as const;

export function getDeviceLanguage(): AppLanguage {
  try {
    return resolveFromDeviceTags(getLocales().map((locale) => locale.languageTag));
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

if (!i18n.isInitialized) {
  // eslint-disable-next-line import/no-named-as-default-member
  void i18n.use(initReactI18next).init({
    resources,
    lng: getDeviceLanguage(),
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: Object.keys(resources),
    interpolation: { escapeValue: false }, // React already escapes output.
    returnNull: false,
    initAsync: false,
  });
}

export async function changeLanguage(language: AppLanguage): Promise<void> {
  if (i18n.language !== language) {
    // eslint-disable-next-line import/no-named-as-default-member
    await i18n.changeLanguage(language);
  }
}

export { i18n };
export * from './languages';
