import { forwardRef, useState } from 'react';
import { Pressable, TextInput, View, type TextInputProps } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import { cn } from '@/lib/cn';

import { Icon, type IconName } from './icon';
import { Text } from './text';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string | null;
  hint?: string;
  icon?: IconName;
  /** Shows a show/hide toggle and masks the value. */
  secure?: boolean;
  showPasswordLabel?: string;
};

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  {
    label,
    error,
    hint,
    icon,
    secure = false,
    showPasswordLabel,
    onFocus,
    onBlur,
    editable = true,
    ...props
  },
  ref,
) {
  const { colors } = useAppTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secure);

  return (
    <View className="gap-1.5">
      <Text variant="caption" tone="muted" nativeID={`${label}-label`}>
        {label}
      </Text>
      <View
        className={cn(
          'h-14 flex-row items-center gap-3 rounded-2xl border bg-white px-4 dark:bg-neutral-900',
          error
            ? 'border-danger-500'
            : focused
              ? 'border-brand-500'
              : 'border-neutral-200 dark:border-neutral-800',
          !editable && 'opacity-60',
        )}
      >
        {icon ? (
          <Icon name={icon} size={20} color={focused ? colors.primary : colors.textMuted} />
        ) : null}
        <TextInput
          ref={ref}
          accessibilityLabel={label}
          accessibilityLabelledBy={`${label}-label`}
          className="h-full flex-1 font-inter text-[15px] text-neutral-900 dark:text-neutral-50"
          placeholderTextColor={colors.textMuted}
          selectionColor={colors.primary}
          secureTextEntry={hidden}
          editable={editable}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...props}
        />
        {secure ? (
          <Pressable
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={showPasswordLabel}
            onPress={() => setHidden((value) => !value)}
          >
            <Icon
              name={hidden ? 'eye-outline' : 'eye-off-outline'}
              size={20}
              color={colors.textMuted}
            />
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <Text variant="caption" tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="muted">
          {hint}
        </Text>
      ) : null}
    </View>
  );
});
