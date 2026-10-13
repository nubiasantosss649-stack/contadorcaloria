import { View, type ViewProps } from 'react-native';

import { cn } from '@/lib/cn';

export type CardProps = ViewProps & {
  className?: string;
  padded?: boolean;
  tone?: 'default' | 'brand' | 'muted';
};

const toneClasses = {
  default: 'bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800',
  brand: 'bg-brand-600 dark:bg-brand-700',
  muted: 'bg-neutral-100 dark:bg-neutral-900',
};

/** Rounded surface with a soft shadow (iOS/web) / low elevation (Android). */
export function Card({ className, padded = true, tone = 'default', style, ...props }: CardProps) {
  return (
    <View
      className={cn('rounded-3xl', toneClasses[tone], padded && 'p-5', className)}
      style={[
        tone !== 'muted' && {
          shadowColor: '#0B1F17',
          shadowOpacity: 0.06,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 2,
        },
        style,
      ]}
      {...props}
    />
  );
}
