import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

import { useAppTheme } from '@/hooks/use-app-theme';

export type ProgressBarProps = {
  /** 0..1 — values outside the range are clamped. */
  progress: number;
  color?: string;
  height?: number;
  accessibilityLabel?: string;
};

export function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function ProgressBar({ progress, color, height = 8, accessibilityLabel }: ProgressBarProps) {
  const { colors } = useAppTheme();
  const value = clampProgress(progress);
  const width = useSharedValue(0);

  useEffect(() => {
    width.set(withTiming(value, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, [value, width]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${width.value * 100}%` }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      style={{ height, borderRadius: height, backgroundColor: colors.track, overflow: 'hidden' }}
    >
      <Animated.View
        style={[
          { height, borderRadius: height, backgroundColor: color ?? colors.primary },
          fillStyle,
        ]}
      />
    </View>
  );
}
