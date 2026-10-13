import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { cn } from '@/lib/cn';

export type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  /** Safe-area edges to pad. Tab screens omit "bottom" because the tab bar handles it. */
  edges?: Edge[];
  className?: string;
  contentClassName?: string;
  footer?: ReactNode;
  keyboard?: boolean;
  /** Horizontal padding for the content area (default true). */
  padded?: boolean;
};

/** Base screen container: safe area, background, max content width and optional scrolling. */
export function Screen({
  children,
  scroll = true,
  edges = ['top', 'bottom'],
  className,
  contentClassName,
  footer,
  keyboard = false,
  padded = true,
}: ScreenProps) {
  const padding = padded ? 'px-5' : 'px-0';
  const content = scroll ? (
    <ScrollView
      className="flex-1"
      contentContainerClassName={cn(
        'w-full max-w-[560px] self-center pb-10 pt-2 gap-6',
        padding,
        contentClassName,
      )}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View className={cn('w-full max-w-[560px] flex-1 self-center', padding, contentClassName)}>
      {children}
    </View>
  );

  return (
    <SafeAreaView
      edges={edges}
      className={cn('flex-1 bg-neutral-50 dark:bg-neutral-950', className)}
    >
      {keyboard ? (
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {content}
          {footer ? (
            <View className="w-full max-w-[560px] self-center px-5 pb-4 pt-2">{footer}</View>
          ) : null}
        </KeyboardAvoidingView>
      ) : (
        <>
          {content}
          {footer ? (
            <View className="w-full max-w-[560px] self-center px-5 pb-4 pt-2">{footer}</View>
          ) : null}
        </>
      )}
    </SafeAreaView>
  );
}
