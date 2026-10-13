import { View } from 'react-native';

import { cn } from '@/lib/cn';

import { PressableScale } from './pressable-scale';
import { Text } from './text';

export type SegmentedOption<T extends string> = { value: T; label: string };

export type SegmentedControlProps<T extends string> = {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel?: string;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      className="flex-row rounded-2xl bg-neutral-100 p-1 dark:bg-neutral-900"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <PressableScale
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={option.label}
            containerStyle={{ flex: 1 }}
            haptic
            scaleTo={0.98}
            onPress={() => onChange(option.value)}
            className={cn(
              'h-10 items-center justify-center rounded-xl px-2',
              selected && 'bg-white dark:bg-neutral-700',
            )}
          >
            <Text
              variant="bodySmall"
              tone={selected ? 'default' : 'muted'}
              className={selected ? 'font-inter-semibold' : 'font-inter-medium'}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              {option.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}
