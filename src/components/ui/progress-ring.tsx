import { useEffect, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

import { useAppTheme } from '@/hooks/use-app-theme';

import { clampProgress } from './progress-bar';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type ProgressRingProps = {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  children?: ReactNode;
  accessibilityLabel?: string;
};

export function ProgressRing({
  progress,
  size = 180,
  strokeWidth = 14,
  color,
  children,
  accessibilityLabel,
}: ProgressRingProps) {
  const { colors } = useAppTheme();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const value = clampProgress(progress);
  const animated = useSharedValue(0);

  useEffect(() => {
    animated.set(withTiming(value, { duration: 900, easing: Easing.out(Easing.cubic) }));
  }, [value, animated]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - animated.value),
    // Hide the rounded cap "dot" when there is no progress at all.
    strokeOpacity: animated.value > 0.001 ? 1 : 0,
  }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(value * 100) }}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg
        width={size}
        height={size}
        style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.track}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color ?? colors.primary}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
          fill="none"
        />
      </Svg>
      {children}
    </View>
  );
}
