import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { cn } from '@/lib/cn';

const variantClasses = {
  display: 'font-inter-extrabold text-[34px] leading-[40px] tracking-tight',
  title: 'font-inter-bold text-[26px] leading-[32px] tracking-tight',
  heading: 'font-inter-semibold text-[19px] leading-[26px]',
  subheading: 'font-inter-semibold text-base leading-[22px]',
  body: 'font-inter text-[15px] leading-[22px]',
  bodySmall: 'font-inter text-[13px] leading-[19px]',
  caption: 'font-inter-medium text-xs leading-4',
  label: 'font-inter-semibold text-xs uppercase leading-4 tracking-wider',
  number: 'font-inter-bold text-[28px] leading-[34px] tracking-tight',
} as const;

const toneClasses = {
  default: 'text-neutral-900 dark:text-neutral-50',
  muted: 'text-neutral-500 dark:text-neutral-400',
  primary: 'text-brand-600 dark:text-brand-400',
  danger: 'text-danger-600 dark:text-danger-500',
  warning: 'text-warning-700 dark:text-warning-500',
  inverse: 'text-white dark:text-neutral-950',
  white: 'text-white',
} as const;

export type TextVariant = keyof typeof variantClasses;
export type TextTone = keyof typeof toneClasses;

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  tone?: TextTone;
  center?: boolean;
  className?: string;
};

export function Text({
  variant = 'body',
  tone = 'default',
  center = false,
  className,
  ...props
}: TextProps) {
  return (
    <RNText
      className={cn(variantClasses[variant], toneClasses[tone], center && 'text-center', className)}
      maxFontSizeMultiplier={1.6}
      {...props}
    />
  );
}
