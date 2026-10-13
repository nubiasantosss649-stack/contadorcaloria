import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { palette } from '@/constants/palette';

import { Icon } from './icon';
import { Text } from './text';

/**
 * Explicit banner for features that are not integrated yet.
 * Use it on every screen/section that would otherwise look functional.
 */
export function InDevelopmentNotice({
  description,
  compact = false,
}: {
  description?: string;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <View
      accessibilityRole="alert"
      testID="in-development-notice"
      className="flex-row gap-3 rounded-2xl border border-warning-100 bg-warning-50 p-4 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <Icon name="construct-outline" size={20} color={palette.warning[500]} />
      <View className="flex-1 gap-0.5">
        <Text variant="subheading" tone="warning">
          {t('common.inDevelopment')}
        </Text>
        {!compact ? (
          <Text variant="bodySmall" tone="muted">
            {description ?? t('common.inDevelopmentDescription')}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
