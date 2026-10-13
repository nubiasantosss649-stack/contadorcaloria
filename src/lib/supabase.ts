import 'react-native-url-polyfill/auto';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import type { Database } from '@/types/database';

import { env, isSupabaseConfigured } from './env';
import { secureSessionStorage } from './secure-session-storage';

export type AppSupabaseClient = SupabaseClient<Database>;

/**
 * Supabase client, or `null` while EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY
 * are not configured. Callers must handle the `null` case explicitly.
 */
export const supabase: AppSupabaseClient | null =
  isSupabaseConfigured && env.supabaseUrl && env.supabaseAnonKey
    ? createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
        auth: {
          // Native: encrypted session (key in Keychain/Keystore). Web: browser localStorage.
          storage: Platform.OS === 'web' ? undefined : secureSessionStorage,
          autoRefreshToken: true,
          persistSession: true,
          // PKCE: email links carry a one-time code that is exchanged in /auth/callback.
          flowType: 'pkce',
          detectSessionInUrl: false,
        },
      })
    : null;

// Refresh tokens only while the app is in the foreground (recommended for React Native).
if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      void supabase.auth.startAutoRefresh();
    } else {
      void supabase.auth.stopAutoRefresh();
    }
  });
}
