import 'i18next';

import type { TranslationResource } from '@/locales/en-US';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: { translation: TranslationResource };
  }
}
