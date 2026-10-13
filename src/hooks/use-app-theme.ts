import { useColorScheme } from 'nativewind';

import { themeColors, type ThemeColors } from '@/constants/theme';

export function useAppTheme(): { scheme: 'light' | 'dark'; isDark: boolean; colors: ThemeColors } {
  const { colorScheme } = useColorScheme();
  const scheme = colorScheme === 'dark' ? 'dark' : 'light';
  return { scheme, isDark: scheme === 'dark', colors: themeColors[scheme] };
}
