import { palette } from './palette';

/** Colors needed in JS (navigation, icons, SVG). Everything else uses Tailwind classes. */
export const themeColors = {
  light: {
    primary: palette.emerald[600],
    primarySoft: palette.emerald[50],
    background: palette.neutral[50],
    surface: palette.white,
    text: palette.neutral[900],
    textMuted: palette.neutral[500],
    border: palette.neutral[200],
    track: palette.neutral[100],
    onPrimary: palette.white,
    danger: palette.danger[600],
  },
  dark: {
    primary: palette.emerald[400],
    primarySoft: palette.emerald[950],
    background: palette.neutral[950],
    surface: palette.neutral[900],
    text: palette.neutral[50],
    textMuted: palette.neutral[400],
    border: palette.neutral[800],
    track: palette.neutral[800],
    onPrimary: palette.neutral[950],
    danger: palette.danger[500],
  },
} as const;

export type ThemeColors = (typeof themeColors)['light'];

export const macroColors = palette.macro;

export const layout = {
  screenPadding: 20,
  maxContentWidth: 560,
} as const;
