import { useTranslation } from 'react-i18next';

import { ServiceError } from '@/services/errors';

/** Turns any thrown error into a safe, translated message (never raw DB text). */
export function useErrorMessage() {
  const { t } = useTranslation();
  return (error: unknown): string => {
    const code = error instanceof ServiceError ? error.code : 'unknown';
    switch (code) {
      case 'not_configured':
        return t('auth.notConfigured.title');
      case 'network':
        return t('errors.network');
      case 'not_authenticated':
        return t('errors.sessionExpired');
      case 'validation':
        return t('errors.validation');
      case 'in_use':
        return t('errors.inUse');
      case 'forbidden':
        return t('errors.forbidden');
      case 'rate_limited':
        return t('errors.rateLimited');
      default:
        return t('errors.generic');
    }
  };
}
