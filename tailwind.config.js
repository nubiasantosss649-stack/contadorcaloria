const { palette } = require('./src/constants/palette');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: palette.emerald,
        neutral: palette.neutral,
        danger: palette.danger,
        warning: palette.warning,
        info: palette.info,
        // Semantic aliases (light / dark pairs are applied with the `dark:` variant).
        surface: { DEFAULT: palette.white, dark: palette.neutral[900] },
        canvas: { DEFAULT: palette.neutral[50], dark: palette.neutral[950] },
      },
      fontFamily: {
        // Distinct family names per weight: on Android, custom fonts ignore fontWeight.
        sans: ['Inter_400Regular'],
        inter: ['Inter_400Regular'],
        'inter-medium': ['Inter_500Medium'],
        'inter-semibold': ['Inter_600SemiBold'],
        'inter-bold': ['Inter_700Bold'],
        'inter-extrabold': ['Inter_800ExtraBold'],
      },
      borderRadius: {
        xl: '14px',
        '2xl': '20px',
        '3xl': '28px',
      },
    },
  },
  plugins: [],
};
