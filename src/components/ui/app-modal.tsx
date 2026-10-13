import type { ReactNode } from 'react';
import { Modal, Pressable, View } from 'react-native';
import Animated, { FadeIn, SlideInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { useAppTheme } from '@/hooks/use-app-theme';

import { Icon, type IconName } from './icon';
import { Text } from './text';

export type AppModalProps = {
  visible: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: IconName;
  children?: ReactNode;
  /** Action buttons rendered at the bottom. */
  actions?: ReactNode;
};

/** Centered dialog with a dimmed backdrop and a gentle entrance animation. */
export function AppModal({
  visible,
  onClose,
  title,
  description,
  icon,
  children,
  actions,
}: AppModalProps) {
  const { colors } = useAppTheme();
  const { t } = useTranslation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View className="flex-1 items-center justify-center px-6">
        {/* Backdrop is a sibling (not a parent) of the dialog to avoid nested buttons on web. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          className="absolute inset-0 bg-black/50"
          onPress={onClose}
        />
        <Animated.View
          entering={SlideInDown.springify().damping(18)}
          style={{ width: '100%', maxWidth: 420 }}
        >
          <View
            accessibilityViewIsModal
            className="gap-4 rounded-3xl bg-white p-6 dark:bg-neutral-900"
          >
            {icon ? (
              <Animated.View entering={FadeIn.delay(120)}>
                <View className="h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-950">
                  <Icon name={icon} size={28} color={colors.primary} />
                </View>
              </Animated.View>
            ) : null}
            <View className="gap-2">
              <Text variant="heading" accessibilityRole="header">
                {title}
              </Text>
              {description ? (
                <Text variant="body" tone="muted">
                  {description}
                </Text>
              ) : null}
            </View>
            {children}
            {actions ? <View className="gap-2 pt-2">{actions}</View> : null}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
