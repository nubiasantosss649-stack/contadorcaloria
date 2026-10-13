import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import LanguageScreen from '@/app/language';
import { accountService } from '@/services/account-service';

import { renderWithProviders, resetAppState } from '../utils/render';

jest.mock('expo-router', () => require('../utils/mocks').expoRouterMock());
jest.mock('@/lib/env', () => ({ env: { appEnv: 'development' }, isSupabaseConfigured: true }));
jest.mock('@/lib/supabase', () => ({ supabase: null }));
jest.mock('@/services/auth-service', () => ({
  authService: {
    getSession: jest.fn(async () => require('../utils/mocks').testSession),
    onSessionChange: jest.fn(() => () => undefined),
  },
}));
jest.mock('@/services/account-service', () => ({
  accountService: { load: jest.fn(), updateProfile: jest.fn(async () => undefined) },
  entitlementsService: { hasPro: jest.fn(async () => false) },
}));

beforeEach(async () => {
  jest.clearAllMocks();
  await resetAppState();
});

describe('Language switching', () => {
  it('switches the UI immediately and saves the choice to the account', async () => {
    await renderWithProviders(<LanguageScreen />);
    expect(screen.getByText('Choose the language used across the app.')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('language-option-es'));
    expect(await screen.findByText('Elige el idioma de la aplicación.')).toBeTruthy();
    await waitFor(() =>
      expect(accountService.updateProfile).toHaveBeenCalledWith({ language: 'es' }),
    );

    await fireEvent.press(screen.getByTestId('language-option-pt-BR'));
    expect(await screen.findByText('Escolha o idioma usado no aplicativo.')).toBeTruthy();
    await waitFor(() =>
      expect(accountService.updateProfile).toHaveBeenLastCalledWith({ language: 'pt-BR' }),
    );

    // "Use device language" resolves to the device locale (en-US in tests).
    await fireEvent.press(screen.getByTestId('language-option-system'));
    expect(await screen.findByText('Choose the language used across the app.')).toBeTruthy();
    await waitFor(() =>
      expect(accountService.updateProfile).toHaveBeenLastCalledWith({ language: 'en-US' }),
    );
  });
});
