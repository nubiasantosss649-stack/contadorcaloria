import { useTranslation } from 'react-i18next';

import { MIN_PASSWORD_LENGTH, type ValidationErrorKey } from '@/lib/validation';
import type { AuthErrorCode } from '@/services/auth-service';

/** Translates validation keys and auth error codes into user-facing messages. */
export function useAuthMessages() {
  const { t } = useTranslation();
  return {
    validation: (key: ValidationErrorKey | null) =>
      key ? t(key, { min: MIN_PASSWORD_LENGTH }) : null,
    request: (code: AuthErrorCode) => {
      switch (code) {
        case 'invalid_credentials':
          return t('auth.errors.invalidCredentials');
        case 'not_configured':
          return t('auth.notConfigured.title');
        default:
          return t('auth.errors.generic');
      }
    },
  };
}
