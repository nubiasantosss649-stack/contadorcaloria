/* eslint-disable @typescript-eslint/no-require-imports */
import type { ReactNode } from 'react';

/** Navigation spy shared by the expo-router mock. */
export const routerMock = {
  push: jest.fn(),
  back: jest.fn(),
  replace: jest.fn(),
  canGoBack: jest.fn(() => true),
};

export const searchParams: { current: Record<string, string> } = { current: {} };

/** Minimal expo-router replacement for rendering a single screen. */
export function expoRouterMock() {
  const React = require('react');
  return {
    router: routerMock,
    Link: ({ children }: { children: ReactNode }) => children,
    useLocalSearchParams: () => searchParams.current,
    useFocusEffect: (callback: () => void) => React.useEffect(() => callback(), [callback]),
  };
}

export const TEST_USER_ID = '00000000-0000-4000-8000-000000000001';

export const testSession = {
  access_token: 'token',
  refresh_token: 'refresh',
  expires_in: 3600,
  token_type: 'bearer',
  user: {
    id: TEST_USER_ID,
    email: 'ana@example.com',
    user_metadata: {},
    app_metadata: {},
    aud: 'authenticated',
  },
};
