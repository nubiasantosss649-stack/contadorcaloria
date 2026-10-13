import type { Session } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';

import { supabase } from '@/lib/supabase';

/**
 * Thin wrapper over Supabase Auth. Every method returns a discriminated result so the UI
 * never has to deal with thrown errors, and so the "backend not configured" case is explicit.
 */
export type AuthErrorCode = 'not_configured' | 'invalid_credentials' | 'unknown';
export type AuthResult<T = void> =
  { ok: true; data: T } | { ok: false; code: AuthErrorCode; message?: string };

const notConfigured = { ok: false, code: 'not_configured' } as const;

function fail(error: { message?: string; code?: string; status?: number }): AuthResult<never> {
  const invalid = error.code === 'invalid_credentials' || error.status === 400;
  return { ok: false, code: invalid ? 'invalid_credentials' : 'unknown', message: error.message };
}

export const authService = {
  async getSession(): Promise<Session | null> {
    if (!supabase) return null;
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  onSessionChange(callback: (session: Session | null) => void): () => void {
    if (!supabase) return () => undefined;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => callback(session));
    return () => data.subscription.unsubscribe();
  },

  async signIn(email: string, password: string): Promise<AuthResult> {
    if (!supabase) return notConfigured;
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    return error ? fail(error) : { ok: true, data: undefined };
  },

  /** Returns `needsConfirmation: true` when the project requires email confirmation. */
  async signUp(
    name: string,
    email: string,
    password: string,
  ): Promise<AuthResult<{ needsConfirmation: boolean }>> {
    if (!supabase) return notConfigured;
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: { display_name: name.trim() },
        emailRedirectTo: Linking.createURL('/login'),
      },
    });
    if (error) return fail(error);
    return { ok: true, data: { needsConfirmation: !data.session } };
  },

  async sendPasswordReset(email: string): Promise<AuthResult> {
    if (!supabase) return notConfigured;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: Linking.createURL('/login'),
    });
    return error ? fail(error) : { ok: true, data: undefined };
  },

  async signOut(): Promise<void> {
    if (!supabase) return;
    await supabase.auth.signOut();
  },
};
