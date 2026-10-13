import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useTranslation } from 'react-i18next';

import { palette } from '@/constants/palette';

import { Text } from '../ui/text';
import { LogoMark } from './logo-mark';

/**
 * In-app splash shown on top of the navigator after the native splash hides.
 * It waits for `ready`, then fades out and unmounts itself.
 */
export function AnimatedSplash({ ready, onHidden }: { ready: boolean; onHidden?: () => void }) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(true);
  const logoScale = useSharedValue(0.85);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    logoOpacity.set(withTiming(1, { duration: 350 }));
    logoScale.set(
      withSequence(
        withTiming(1.04, { duration: 420, easing: Easing.out(Easing.cubic) }),
        withTiming(1, { duration: 200 }),
      ),
    );
    textOpacity.set(withDelay(250, withTiming(1, { duration: 400 })));
  }, [logoOpacity, logoScale, textOpacity]);

  useEffect(() => {
    if (!ready) return;
    const finish = () => {
      setVisible(false);
      onHidden?.();
    };
    containerOpacity.set(
      withDelay(
        450,
        withTiming(0, { duration: 350 }, (finished) => {
          if (finished) scheduleOnRN(finish);
        }),
      ),
    );
  }, [ready, containerOpacity, onHidden]);

  const containerStyle = useAnimatedStyle(() => ({ opacity: containerOpacity.value }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents={ready ? 'none' : 'auto'}
      style={[StyleSheet.absoluteFill, styles.container, containerStyle]}
      testID="animated-splash"
    >
      <Animated.View style={logoStyle}>
        <LogoMark size={96} inverted />
      </Animated.View>
      <Animated.View style={[styles.text, textStyle]}>
        <Text variant="title" tone="white" center>
          {t('common.appName')}
        </Text>
        <View style={{ height: 4 }} />
        <Text variant="body" center style={{ color: palette.emerald[100] }}>
          {t('splash.tagline')}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: palette.emerald[600],
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  text: { marginTop: 24, alignItems: 'center' },
});
