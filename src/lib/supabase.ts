import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import type { Database } from '@/types/database';

import { env, isSupabaseConfigured } from './env';

/**
 * Supabase client, or `null` while EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY
 * are not configured. Callers must handle the `null` case explicitly.
 */
export const supabase: SupabaseClient<Database> | null =
  isSupabaseConfigured && env.supabaseUrl && env.supabaseAnonKey
    ? createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
        auth: {
          // AsyncStorage is used (instead of SecureStore) because sessions can exceed
          // SecureStore's 2 KB value limit. On web it falls back to localStorage.
          storage: Platform.OS === 'web' ? undefined : AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: Platform.OS === 'web',
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
