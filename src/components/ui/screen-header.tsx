import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '@/hooks/use-app-theme';

import { Icon } from './icon';
import { Text } from './text';

export type ScreenHeaderProps = {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  /** Use a close (×) icon instead of a back arrow, e.g. for modals. */
  closeIcon?: boolean;
  right?: ReactNode;
  large?: boolean;
};

export function ScreenHeader({
  title,
  subtitle,
  showBack = false,
  closeIcon = false,
  right,
  large = false,
}: ScreenHeaderProps) {
  const { colors } = useAppTheme();
  const { t } = useTranslation();

  return (
    <View className="gap-3">
      {showBack || right ? (
        <View className="h-11 flex-row items-center justify-between">
          {showBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={closeIcon ? t('common.close') : t('common.back')}
              hitSlop={12}
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
              className="h-11 w-11 items-center justify-center rounded-full bg-white dark:bg-neutral-900"
            >
              <Icon name={closeIcon ? 'close' : 'chevron-back'} size={22} color={colors.text} />
            </Pressable>
          ) : (
            <View />
          )}
          {right}
        </View>
      ) : null}
      {title ? (
        <View className="gap-1">
          <Text variant={large ? 'display' : 'title'} accessibilityRole="header">
            {title}
          </Text>
          {subtitle ? (
            <Text variant="body" tone="muted">
              {subtitle}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
