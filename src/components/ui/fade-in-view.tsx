import type { ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';

const ANIMATIONS = { down: FadeInDown, up: FadeInUp, none: FadeIn } as const;

export type FadeInViewProps = {
  children: ReactNode;
  delay?: number;
  duration?: number;
  /** Direction the content comes from. */
  from?: keyof typeof ANIMATIONS;
  className?: string;
};

/**
 * Discreet entrance animation. Styling goes on an inner View because NativeWind's
 * `className` is not applied to Reanimated's Animated.View.
 */
export function FadeInView({
  children,
  delay = 0,
  duration = 500,
  from = 'down',
  className,
}: FadeInViewProps) {
  return (
    <Animated.View entering={ANIMATIONS[from].delay(delay).duration(duration)}>
      <View className={className}>{children}</View>
    </Animated.View>
  );
}
