import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import ForgotPasswordScreen from '@/app/(auth)/forgot-password';
import LoginScreen from '@/app/(auth)/login';
import RegisterScreen from '@/app/(auth)/register';
import ResetPasswordScreen from '@/app/reset-password';
import { authService } from '@/services/auth-service';

import { renderWithProviders, resetAppState } from '../utils/render';

jest.mock('expo-router', () => require('../utils/mocks').expoRouterMock());
jest.mock('@/lib/env', () => ({ env: { appEnv: 'development' }, isSupabaseConfigured: true }));
jest.mock('@/lib/supabase', () => ({ supabase: null }));
jest.mock('@/services/auth-service', () => ({
  authService: {
    getSession: jest.fn(async () => null),
    onSessionChange: jest.fn(() => () => undefined),
    signIn: jest.fn(),
    signUp: jest.fn(),
    resendConfirmation: jest.fn(),
    sendPasswordReset: jest.fn(),
    updatePassword: jest.fn(),
    signOut: jest.fn(),
  },
}));

const auth = jest.mocked(authService);

beforeEach(async () => {
  jest.clearAllMocks();
  await resetAppState();
});

describe('Login', () => {
  it('validates before calling Supabase', async () => {
    await renderWithProviders(<LoginScreen />);
    await fireEvent.press(screen.getByTestId('login-submit'));
    expect(await screen.findByText('Enter your email.')).toBeTruthy();
    expect(screen.getByText('Enter your password.')).toBeTruthy();
    expect(auth.signIn).not.toHaveBeenCalled();
  });

  it('signs in with the typed credentials', async () => {
    auth.signIn.mockResolvedValue({ ok: true, data: undefined });
    await renderWithProviders(<LoginScreen />);
    await fireEvent.changeText(screen.getByTestId('login-email'), 'ana@example.com');
    await fireEvent.changeText(screen.getByTestId('login-password'), 'secret123');
    await fireEvent.press(screen.getByTestId('login-submit'));
    await waitFor(() => expect(auth.signIn).toHaveBeenCalledWith('ana@example.com', 'secret123'));
  });

  it('shows invalid credentials and offers to resend the confirmation email', async () => {
    auth.signIn.mockResolvedValueOnce({ ok: false, code: 'invalid_credentials' });
    auth.signIn.mockResolvedValueOnce({ ok: false, code: 'email_not_confirmed' });
    auth.resendConfirmation.mockResolvedValue({ ok: true, data: undefined });
    await renderWithProviders(<LoginScreen />);
    await fireEvent.changeText(screen.getByTestId('login-email'), 'ana@example.com');
    await fireEvent.changeText(screen.getByTestId('login-password'), 'wrong');
    await fireEvent.press(screen.getByTestId('login-submit'));
    expect(await screen.findByText('Incorrect email or password.')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('login-submit'));
    expect(
      await screen.findByText('Confirm your email before signing in. Check your inbox.'),
    ).toBeTruthy();
    await fireEvent.press(screen.getByText('Resend confirmation email'));
    await waitFor(() => expect(auth.resendConfirmation).toHaveBeenCalledWith('ana@example.com'));
    expect(await screen.findByText('Confirmation email sent')).toBeTruthy();
  });
});

describe('Register', () => {
  const fill = async (confirmation = 'secret123') => {
    await fireEvent.changeText(screen.getByTestId('register-name'), 'Ana');
    await fireEvent.changeText(screen.getByTestId('register-email'), 'ana@example.com');
    await fireEvent.changeText(screen.getByTestId('register-password'), 'secret123');
    await fireEvent.changeText(screen.getByTestId('register-confirmation'), confirmation);
    await fireEvent.press(screen.getByTestId('register-submit'));
  };

  it('rejects mismatched passwords', async () => {
    await renderWithProviders(<RegisterScreen />);
    await fill('different1');
    expect(await screen.findByText("Passwords don't match.")).toBeTruthy();
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it('creates the account with the current language and asks to confirm the email', async () => {
    auth.signUp.mockResolvedValue({ ok: true, data: { needsConfirmation: true } });
    await renderWithProviders(<RegisterScreen />);
    await fill();
    await waitFor(() =>
      expect(auth.signUp).toHaveBeenCalledWith('Ana', 'ana@example.com', 'secret123', 'en-US'),
    );
    expect(await screen.findByText('Check your email')).toBeTruthy();
  });
});

describe('Password recovery', () => {
  it('sends the reset link', async () => {
    auth.sendPasswordReset.mockResolvedValue({ ok: true, data: undefined });
    await renderWithProviders(<ForgotPasswordScreen />);
    await fireEvent.changeText(screen.getByTestId('forgot-email'), 'ana@example.com');
    await fireEvent.press(screen.getByTestId('forgot-submit'));
    await waitFor(() => expect(auth.sendPasswordReset).toHaveBeenCalledWith('ana@example.com'));
    expect(await screen.findByText('Email sent')).toBeTruthy();
  });

  it('sets a new password after opening the link', async () => {
    auth.updatePassword.mockResolvedValue({ ok: true, data: undefined });
    await renderWithProviders(<ResetPasswordScreen />);
    await fireEvent.changeText(screen.getByTestId('reset-password'), 'short');
    await fireEvent.press(screen.getByTestId('reset-submit'));
    expect(await screen.findByText('Password must be at least 8 characters.')).toBeTruthy();
    expect(auth.updatePassword).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByTestId('reset-password'), 'newSecret1');
    await fireEvent.changeText(screen.getByTestId('reset-confirmation'), 'newSecret1');
    await fireEvent.press(screen.getByTestId('reset-submit'));
    await waitFor(() => expect(auth.updatePassword).toHaveBeenCalledWith('newSecret1'));
  });
});
