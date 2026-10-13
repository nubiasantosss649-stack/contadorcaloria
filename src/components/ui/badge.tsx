import { View } from 'react-native';

import { cn } from '@/lib/cn';

import { Text, type TextTone } from './text';

type BadgeTone = 'brand' | 'neutral' | 'warning' | 'solid';

const containerClasses: Record<BadgeTone, string> = {
  brand: 'bg-brand-50 dark:bg-brand-950',
  neutral: 'bg-neutral-100 dark:bg-neutral-800',
  warning: 'bg-warning-100 dark:bg-neutral-800',
  solid: 'bg-brand-600',
};

const textTones: Record<BadgeTone, TextTone> = {
  brand: 'primary',
  neutral: 'muted',
  warning: 'warning',
  solid: 'white',
};

export function Badge({
  label,
  tone = 'brand',
  className,
}: {
  label: string;
  tone?: BadgeTone;
  className?: string;
}) {
  return (
    <View className={cn('self-start rounded-full px-2.5 py-1', containerClasses[tone], className)}>
      <Text variant="caption" tone={textTones[tone]} className="font-inter-semibold">
        {label}
      </Text>
    </View>
  );
}
