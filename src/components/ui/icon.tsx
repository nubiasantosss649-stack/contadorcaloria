import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

export type IconName = ComponentProps<typeof Ionicons>['name'];

export type IconProps = {
  name: IconName;
  size?: number;
  color: ColorValue;
};

/** Minimal outline icon set (Ionicons). */
export function Icon({ name, size = 22, color }: IconProps) {
  return <Ionicons name={name} size={size} color={color} />;
}
