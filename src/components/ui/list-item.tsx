import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';
import { cn } from '@/lib/cn';

import { Icon, type IconName } from './icon';
import { Text } from './text';

export type ListItemProps = {
  title: string;
  subtitle?: string;
  icon?: IconName;
  value?: string;
  right?: ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  selected?: boolean;
  showChevron?: boolean;
  testID?: string;
};

export function ListItem({
  title,
  subtitle,
  icon,
  value,
  right,
  onPress,
  destructive = false,
  selected,
  showChevron = Boolean(onPress) && selected === undefined,
  testID,
}: ListItemProps) {
  const { colors } = useAppTheme();
  const tint = destructive ? colors.danger : colors.primary;

  return (
    <Pressable
      testID={testID}
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={selected === undefined ? (onPress ? 'button' : 'text') : 'radio'}
      accessibilityState={selected === undefined ? undefined : { checked: selected }}
      className="min-h-[60px] flex-row items-center gap-3.5 px-4 py-3 active:bg-neutral-50 dark:active:bg-neutral-800"
    >
      {icon ? (
        <View
          className={cn(
            'h-9 w-9 items-center justify-center rounded-xl',
            destructive ? 'bg-danger-50 dark:bg-neutral-800' : 'bg-brand-50 dark:bg-brand-950',
          )}
        >
          <Icon name={icon} size={19} color={tint} />
        </View>
      ) : null}
      <View className="flex-1 gap-0.5">
        <Text
          variant="body"
          tone={destructive ? 'danger' : 'default'}
          className="font-inter-medium"
        >
          {title}
        </Text>
        {subtitle ? (
          <Text variant="bodySmall" tone="muted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {value ? (
        <Text variant="bodySmall" tone="muted">
          {value}
        </Text>
      ) : null}
      {right}
      {selected !== undefined ? (
        <Icon
          name={selected ? 'checkmark-circle' : 'ellipse-outline'}
          size={22}
          color={selected ? colors.primary : colors.border}
        />
      ) : null}
      {showChevron ? <Icon name="chevron-forward" size={18} color={colors.textMuted} /> : null}
    </Pressable>
  );
}

/** Groups ListItems inside a rounded card with hairline separators. */
export function ListGroup({ title, children }: { title?: string; children: ReactNode }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : [children];
  return (
    <View className="gap-2">
      {title ? (
        <Text variant="label" tone="muted" className="px-1">
          {title}
        </Text>
      ) : null}
      <View className="overflow-hidden rounded-3xl border border-neutral-100 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        {items.map((child, index) => (
          <View key={index}>
            {index > 0 ? <View className="ml-4 h-px bg-neutral-100 dark:bg-neutral-800" /> : null}
            {child}
          </View>
        ))}
      </View>
    </View>
  );
}
