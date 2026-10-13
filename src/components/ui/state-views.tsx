import { ActivityIndicator, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '@/hooks/use-app-theme';

import { Button } from './button';
import { EmptyState } from './empty-state';

export function LoadingView({ label }: { label?: string }) {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  return (
    <View
      className="flex-1 items-center justify-center bg-neutral-50 dark:bg-neutral-950"
      accessibilityLabel={label ?? t('common.loading')}
      testID="loading-view"
    >
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function ErrorView({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useTranslation();
  return (
    <View className="gap-2" testID="error-view">
      <EmptyState
        icon="cloud-offline-outline"
        title={t('common.errorTitle')}
        description={message}
      />
      {onRetry ? <Button label={t('common.retry')} variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}
