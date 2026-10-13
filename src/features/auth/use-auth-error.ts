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
        case 'email_not_confirmed':
          return t('auth.errors.emailNotConfirmed');
        case 'weak_password':
          return t('auth.errors.weakPassword');
        case 'same_password':
          return t('auth.errors.samePassword');
        case 'rate_limited':
          return t('errors.rateLimited');
        case 'link_invalid':
          return t('auth.callback.invalidDescription');
        case 'network':
          return t('errors.network');
        case 'not_configured':
          return t('auth.notConfigured.title');
        default:
          return t('auth.errors.generic');
      }
    },
  };
}
