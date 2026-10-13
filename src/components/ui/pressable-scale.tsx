import * as Haptics from 'expo-haptics';
import type { ReactNode } from 'react';
import {
  Platform,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

export type PressableScaleProps = Omit<PressableProps, 'style' | 'children'> & {
  children: ReactNode;
  className?: string;
  /** Style for the animated outer container (e.g. `{ flex: 1 }`). */
  containerStyle?: StyleProp<ViewStyle>;
  haptic?: boolean;
  scaleTo?: number;
};

const SPRING = { damping: 18, stiffness: 320, mass: 0.6 };

/** Pressable with a subtle spring scale and optional light haptic feedback. */
export function PressableScale({
  children,
  className,
  containerStyle,
  haptic = false,
  scaleTo = 0.97,
  disabled,
  onPressIn,
  onPressOut,
  onPress,
  ...props
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[animatedStyle, containerStyle]}>
      <Pressable
        className={className}
        disabled={disabled}
        onPressIn={(event) => {
          scale.set(withSpring(scaleTo, SPRING));
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          scale.set(withSpring(1, SPRING));
          onPressOut?.(event);
        }}
        onPress={(event) => {
          if (haptic && Platform.OS !== 'web') {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          onPress?.(event);
        }}
        {...props}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
