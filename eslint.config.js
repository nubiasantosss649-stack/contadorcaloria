// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    ignores: ['dist/*', '.expo/*', 'coverage/*', 'ios/*', 'android/*'],
  },
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'react/jsx-no-literals': 'off',
    },
  },
  {
    files: ['tests/**/*', '**/*.test.ts', '**/*.test.tsx', 'jest.setup.ts'],
    languageOptions: { globals: { jest: 'readonly' } },
  },
]);
