import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, Icon, Text } from '@/components/ui';
import { palette } from '@/constants/palette';

import { useAuth } from '../auth-provider';

/**
 * Shown on auth screens when Supabase is not configured. Explains why sign-in is disabled
 * and, in development builds only, offers an explicit "preview" to browse the UI.
 */
export function BackendStatus({ showPreview = false }: { showPreview?: boolean }) {
  const { t } = useTranslation();
  const { isBackendConfigured, canUsePreview, enterPreview } = useAuth();

  if (isBackendConfigured) return null;

  return (
    <View className="gap-3">
      <View
        accessibilityRole="alert"
        testID="backend-not-configured"
        className="flex-row gap-3 rounded-2xl border border-warning-100 bg-warning-50 p-4 dark:border-neutral-800 dark:bg-neutral-900"
      >
        <Icon name="cloud-offline-outline" size={20} color={palette.warning[500]} />
        <View className="flex-1 gap-0.5">
          <Text variant="subheading" tone="warning">
            {t('auth.notConfigured.title')}
          </Text>
          <Text variant="bodySmall" tone="muted">
            {t('auth.notConfigured.description')}
          </Text>
        </View>
      </View>
      {showPreview && canUsePreview ? (
        <View className="gap-1.5">
          <Button
            label={t('auth.preview.button')}
            variant="outline"
            icon="eye-outline"
            onPress={enterPreview}
            testID="enter-preview"
          />
          <Text variant="caption" tone="muted" center>
            {t('auth.preview.description')}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
