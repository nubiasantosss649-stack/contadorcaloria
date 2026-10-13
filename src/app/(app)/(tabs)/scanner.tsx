import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import {
  Button,
  Card,
  Icon,
  InDevelopmentNotice,
  Screen,
  ScreenHeader,
  Text,
} from '@/components/ui';
import { palette } from '@/constants/palette';
import { useAppTheme } from '@/hooks/use-app-theme';

const FRAME_HEIGHT = 280;

function ScanLine() {
  const position = useSharedValue(0);
  useEffect(() => {
    position.set(
      withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.quad) }), -1, true),
    );
  }, [position]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: position.value * (FRAME_HEIGHT - 40) }],
  }));
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: 24,
          right: 24,
          top: 20,
          height: 2,
          backgroundColor: palette.emerald[400],
          opacity: 0.8,
        },
        style,
      ]}
    />
  );
}

export default function ScannerScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const steps = [t('scanner.step1'), t('scanner.step2'), t('scanner.step3')];

  return (
    <Screen edges={['top']}>
      <ScreenHeader title={t('scanner.title')} subtitle={t('scanner.subtitle')} />

      <InDevelopmentNotice description={t('scanner.unavailable')} />

      {/* Placeholder frame — no camera is opened in Phase 1. */}
      <View
        accessibilityLabel={t('scanner.cameraPlaceholder')}
        style={{ height: FRAME_HEIGHT }}
        className="items-center justify-center overflow-hidden rounded-3xl bg-neutral-900"
      >
        {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map((corner) => (
          <View
            key={corner}
            style={{
              position: 'absolute',
              width: 36,
              height: 36,
              borderColor: palette.emerald[400],
              ...(corner.includes('top')
                ? { top: 16, borderTopWidth: 3 }
                : { bottom: 16, borderBottomWidth: 3 }),
              ...(corner.includes('left')
                ? { left: 16, borderLeftWidth: 3 }
                : { right: 16, borderRightWidth: 3 }),
              borderRadius: 6,
            }}
          />
        ))}
        <ScanLine />
        <Icon name="camera-outline" size={44} color={palette.neutral[500]} />
        <Text variant="bodySmall" className="mt-2 text-neutral-400">
          {t('scanner.cameraPlaceholder')}
        </Text>
      </View>

      <View className="gap-3">
        <Button label={t('scanner.takePhoto')} icon="camera" disabled />
        <Button
          label={t('scanner.pickFromGallery')}
          icon="images-outline"
          variant="outline"
          disabled
        />
      </View>

      <Card className="gap-4">
        <Text variant="subheading">{t('scanner.howItWorks')}</Text>
        {steps.map((step, index) => (
          <View key={step} className="flex-row items-center gap-3">
            <View className="h-8 w-8 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-950">
              <Text variant="bodySmall" tone="primary" className="font-inter-bold">
                {index + 1}
              </Text>
            </View>
            <Text variant="body" className="flex-1">
              {step}
            </Text>
          </View>
        ))}
        <View className="flex-row items-center gap-2">
          <Icon name="information-circle-outline" size={16} color={colors.textMuted} />
          <Text variant="caption" tone="muted">
            {t('common.inDevelopment')}
          </Text>
        </View>
      </Card>
    </Screen>
  );
}
