import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

import { AuthProvider } from '@/features/auth/auth-provider';
import { PreferencesProvider } from '@/features/preferences/preferences-provider';
import { changeLanguage } from '@/lib/i18n';

/** Renders a screen with the app's real providers and a fresh query cache. */
export async function renderWithProviders(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: Infinity },
      mutations: { retry: false, gcTime: Infinity },
    },
  });
  const result = await render(
    <QueryClientProvider client={queryClient}>
      <PreferencesProvider>
        <AuthProvider>{ui}</AuthProvider>
      </PreferencesProvider>
    </QueryClientProvider>,
  );
  return { ...result, queryClient };
}

/** Resets global state shared between tests (i18n language and persisted preferences). */
export async function resetAppState() {
  await AsyncStorage.clear();
  await changeLanguage('en-US');
}
