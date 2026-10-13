import { ActivityIndicator, View, type StyleProp, type ViewStyle } from 'react-native';

import { palette } from '@/constants/palette';
import { useAppTheme } from '@/hooks/use-app-theme';
import { cn } from '@/lib/cn';

import { Icon, type IconName } from './icon';
import { PressableScale } from './pressable-scale';
import { Text, type TextTone } from './text';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const containerByVariant: Record<ButtonVariant, string> = {
  primary: 'bg-brand-600 dark:bg-brand-500',
  secondary: 'bg-brand-50 dark:bg-brand-950',
  outline: 'border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-900',
  ghost: 'bg-transparent',
  danger: 'bg-danger-50 dark:bg-neutral-900',
};

const toneByVariant: Record<ButtonVariant, TextTone> = {
  primary: 'white',
  secondary: 'primary',
  outline: 'default',
  ghost: 'primary',
  danger: 'danger',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-10 px-4 gap-1.5',
  md: 'h-12 px-5 gap-2',
  lg: 'h-14 px-6 gap-2',
};

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityHint?: string;
  testID?: string;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = true,
  style,
  accessibilityHint,
  testID,
}: ButtonProps) {
  const { colors } = useAppTheme();
  const isDisabled = disabled || loading;
  const contentColor =
    variant === 'primary'
      ? palette.white
      : variant === 'danger'
        ? colors.danger
        : variant === 'outline'
          ? colors.text
          : colors.primary;

  const iconNode = icon ? (
    <Icon name={icon} size={size === 'sm' ? 16 : 20} color={contentColor} />
  ) : null;

  return (
    <PressableScale
      haptic
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      testID={testID}
      containerStyle={[fullWidth ? { alignSelf: 'stretch' } : { alignSelf: 'flex-start' }, style]}
      className={cn(
        'flex-row items-center justify-center rounded-2xl',
        containerByVariant[variant],
        sizeClasses[size],
        isDisabled && 'opacity-50',
      )}
    >
      {loading ? (
        <ActivityIndicator color={contentColor} />
      ) : (
        <View className="flex-row items-center gap-2">
          {iconPosition === 'left' && iconNode}
          <Text
            variant={size === 'sm' ? 'bodySmall' : 'subheading'}
            tone={toneByVariant[variant]}
            className="font-inter-semibold"
          >
            {label}
          </Text>
          {iconPosition === 'right' && iconNode}
        </View>
      )}
    </PressableScale>
  );
}
