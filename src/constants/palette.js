// Single source of truth for raw colors. Plain CommonJS so tailwind.config.js can require it.
const palette = {
  white: '#FFFFFF',
  black: '#000000',
  emerald: {
    50: '#ECFDF5',
    100: '#D1FAE5',
    200: '#A7F3D0',
    300: '#6EE7B7',
    400: '#34D399',
    500: '#10B981',
    600: '#059669',
    700: '#047857',
    800: '#065F46',
    900: '#064E3B',
    950: '#022C22',
  },
  neutral: {
    50: '#F7F8F9',
    100: '#F0F2F4',
    200: '#E3E6EA',
    300: '#CDD2D8',
    400: '#9AA3AE',
    500: '#6B7480',
    600: '#4B535D',
    700: '#363C44',
    800: '#23272D',
    900: '#16191D',
    950: '#0C0E10',
  },
  danger: { 50: '#FEF2F2', 500: '#EF4444', 600: '#DC2626' },
  warning: { 50: '#FFFBEB', 100: '#FEF3C7', 500: '#F59E0B', 700: '#B45309' },
  info: { 50: '#EFF6FF', 500: '#3B82F6' },
  macro: { protein: '#6366F1', carbs: '#F59E0B', fat: '#EC4899' },
};

module.exports = { palette };
