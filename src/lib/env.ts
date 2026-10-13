/**
 * Typed access to public environment variables.
 * `EXPO_PUBLIC_*` variables must be referenced statically (process.env.EXPO_PUBLIC_X)
 * so Expo can inline them at build time.
 */
export type AppEnvironment = 'development' | 'preview' | 'production';

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function parseAppEnv(value: string | undefined): AppEnvironment {
  return value === 'preview' || value === 'production' ? value : 'development';
}

export const env = {
  appEnv: parseAppEnv(clean(process.env.EXPO_PUBLIC_APP_ENV)),
  supabaseUrl: clean(process.env.EXPO_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: clean(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY),
  revenueCatIosKey: clean(process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY),
  revenueCatAndroidKey: clean(process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY),
  termsUrl: clean(process.env.EXPO_PUBLIC_TERMS_URL),
  privacyUrl: clean(process.env.EXPO_PUBLIC_PRIVACY_URL),
} as const;

export const isSupabaseConfigured = Boolean(env.supabaseUrl && env.supabaseAnonKey);
