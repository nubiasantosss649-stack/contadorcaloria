import type { EmailOtpType, Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';

import { supabase } from '@/lib/supabase';

/**
 * Thin wrapper over Supabase Auth. Every method returns a discriminated result so the UI
 * never has to deal with thrown errors, and so the "backend not configured" case is explicit.
 * Passwords are only ever sent to Supabase Auth over HTTPS — never stored by the app.
 */
export type AuthErrorCode =
  | 'not_configured'
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'weak_password'
  | 'same_password'
  | 'rate_limited'
  | 'link_invalid'
  | 'network'
  | 'not_available'
  | 'unknown';

export type AuthResult<T = void> =
  { ok: true; data: T } | { ok: false; code: AuthErrorCode; message?: string };

export type OAuthProvider = 'apple' | 'google';

const notConfigured = { ok: false, code: 'not_configured' } as const;
const success = { ok: true, data: undefined } as const;

type AuthErrorLike = { message?: string; code?: string; status?: number; name?: string };

export function mapAuthError(error: AuthErrorLike): AuthResult<never> {
  const code = error.code ?? '';
  const message = error.message;
  if (code === 'invalid_credentials' || /invalid login credentials/i.test(message ?? '')) {
    return { ok: false, code: 'invalid_credentials', message };
  }
  if (code === 'email_not_confirmed') return { ok: false, code: 'email_not_confirmed', message };
  if (code === 'weak_password') return { ok: false, code: 'weak_password', message };
  if (code === 'same_password') return { ok: false, code: 'same_password', message };
  if (error.status === 429 || code.startsWith('over_'))
    return { ok: false, code: 'rate_limited', message };
  if (code === 'otp_expired' || code === 'flow_state_not_found' || code === 'bad_code_verifier') {
    return { ok: false, code: 'link_invalid', message };
  }
  if (error.name === 'AuthRetryableFetchError' || /network|fetch/i.test(message ?? '')) {
    return { ok: false, code: 'network', message };
  }
  return { ok: false, code: 'unknown', message };
}

/** Deep link that email confirmation / password reset links return to. */
export function authCallbackUrl(next?: 'reset-password'): string {
  return Linking.createURL('/auth/callback', next ? { queryParams: { next } } : undefined);
}

export type AuthRedirectParams = {
  code: string | null;
  tokenHash: string | null;
  type: EmailOtpType | null;
  next: string | null;
  error: string | null;
};

const OTP_TYPES: readonly EmailOtpType[] = [
  'signup',
  'invite',
  'magiclink',
  'recovery',
  'email_change',
  'email',
];

/** Reads auth params from both the query string and the hash fragment of a redirect URL. */
export function parseAuthRedirect(url: string): AuthRedirectParams {
  const params = new Map<string, string>();
  const [beforeHash = '', hash = ''] = url.split('#');
  const query = beforeHash.includes('?') ? beforeHash.slice(beforeHash.indexOf('?') + 1) : '';
  for (const part of [query, hash]) {
    for (const pair of part.split('&')) {
      if (!pair) continue;
      const [rawKey = '', rawValue = ''] = pair.split('=');
      try {
        params.set(decodeURIComponent(rawKey), decodeURIComponent(rawValue.replace(/\+/g, ' ')));
      } catch {
        // Ignore malformed pairs.
      }
    }
  }
  const type = params.get('type');
  return {
    code: params.get('code') ?? null,
    tokenHash: params.get('token_hash') ?? null,
    type: type && (OTP_TYPES as readonly string[]).includes(type) ? (type as EmailOtpType) : null,
    next: params.get('next') ?? null,
    error: params.get('error_description') ?? params.get('error') ?? null,
  };
}

export const authService = {
  async getSession(): Promise<Session | null> {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  onSessionChange(callback: (session: Session | null, event: string) => void): () => void {
    if (!supabase) return () => undefined;
    const { data } = supabase.auth.onAuthStateChange((event, session) => callback(session, event));
    return () => data.subscription.unsubscribe();
  },

  async signIn(email: string, password: string): Promise<AuthResult> {
    if (!supabase) return notConfigured;
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    return error ? mapAuthError(error) : success;
  },

  /**
   * Returns `needsConfirmation: true` when the project requires email confirmation.
   * Supabase intentionally does not reveal whether an email is already registered.
   */
  async signUp(
    name: string,
    email: string,
    password: string,
    language: string,
  ): Promise<AuthResult<{ needsConfirmation: boolean }>> {
    if (!supabase) return notConfigured;
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: name.trim(), language },
        emailRedirectTo: authCallbackUrl(),
      },
    });
    if (error) return mapAuthError(error);
    return { ok: true, data: { needsConfirmation: !data.session } };
  },

  async resendConfirmation(email: string): Promise<AuthResult> {
    if (!supabase) return notConfigured;
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: { emailRedirectTo: authCallbackUrl() },
    });
    return error ? mapAuthError(error) : success;
  },

  async sendPasswordReset(email: string): Promise<AuthResult> {
    if (!supabase) return notConfigured;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: authCallbackUrl('reset-password'),
    });
    return error ? mapAuthError(error) : success;
  },

  /** Completes an email link (confirmation or recovery) and creates the session. */
  async completeRedirect(
    url: string,
  ): Promise<AuthResult<{ next: string | null; recovery: boolean }>> {
    if (!supabase) return notConfigured;
    const params = parseAuthRedirect(url);
    if (params.error) return { ok: false, code: 'link_invalid', message: params.error };
    if (params.code) {
      const { error } = await supabase.auth.exchangeCodeForSession(params.code);
      if (error) return mapAuthError(error);
      return { ok: true, data: { next: params.next, recovery: params.next === 'reset-password' } };
    }
    if (params.tokenHash && params.type) {
      const { error } = await supabase.auth.verifyOtp({
        token_hash: params.tokenHash,
        type: params.type,
      });
      if (error) return mapAuthError(error);
      return { ok: true, data: { next: params.next, recovery: params.type === 'recovery' } };
    }
    return { ok: false, code: 'link_invalid' };
  },

  async updatePassword(password: string): Promise<AuthResult> {
    if (!supabase) return notConfigured;
    const { error } = await supabase.auth.updateUser({ password });
    return error ? mapAuthError(error) : success;
  },

  /**
   * Prepared for Apple Sign-In / Google Sign-In (Phase 3+). Needs the providers enabled in
   * Supabase and native modules (expo-apple-authentication / Google Sign-In) in a dev build.
   */
  async signInWithProvider(provider: OAuthProvider): Promise<AuthResult> {
    void provider;
    if (!supabase) return notConfigured;
    return { ok: false, code: 'not_available' };
  },

  async signOut(): Promise<void> {
    if (!supabase) return;
    // "local" clears this device's session even when offline.
    await supabase.auth.signOut({ scope: 'local' });
  },

  /**
   * Permanently deletes the account: the `delete_own_account` database function removes the
   * auth user and every personal row cascades. Then the local session is cleared.
   */
  async deleteAccount(): Promise<AuthResult> {
    if (!supabase) return notConfigured;
    const { error } = await supabase.rpc('delete_own_account');
    if (error) return { ok: false, code: 'unknown', message: error.message };
    await supabase.auth.signOut({ scope: 'local' });
    return success;
  },
};
