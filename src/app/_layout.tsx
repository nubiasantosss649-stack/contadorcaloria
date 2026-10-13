import '@/global.css';
import '@/lib/i18n';

// Deep imports so only the five weights we use are bundled.
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { Inter_800ExtraBold } from '@expo-google-fonts/inter/800ExtraBold';
import { QueryClientProvider } from '@tanstack/react-query';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplash } from '@/components/brand/animated-splash';
import { AuthProvider, useAuth } from '@/features/auth/auth-provider';
import { PreferencesProvider, usePreferences } from '@/features/preferences/preferences-provider';
import { useAppTheme } from '@/hooks/use-app-theme';
import { queryClient } from '@/lib/query-client';

export { ErrorBoundary } from 'expo-router';

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <PreferencesProvider>
            <AuthProvider>
              <RootNavigator />
            </AuthProvider>
          </PreferencesProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });
  const { isHydrated, hasCompletedOnboarding } = usePreferences();
  const { status, isRecoveringPassword } = useAuth();
  const { isDark, colors } = useAppTheme();

  // If fonts fail to load we still start the app with the system font.
  const ready = (fontsLoaded || Boolean(fontError)) && isHydrated && status !== 'loading';
  const isSignedIn = status === 'signedIn';

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync().catch(() => undefined);
  }, [ready]);

  const navigationTheme = useMemo<Theme>(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
      },
    };
  }, [isDark, colors]);

  if (!ready) return null;

  return (
    <ThemeProvider value={navigationTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
          }}
        >
          {/* Intro slides, only before the first sign-in on this device. */}
          <Stack.Protected guard={!hasCompletedOnboarding && !isSignedIn}>
            <Stack.Screen name="(onboarding)" />
          </Stack.Protected>
          <Stack.Protected guard={hasCompletedOnboarding && !isSignedIn}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
          <Stack.Protected guard={isSignedIn && !isRecoveringPassword}>
            <Stack.Screen name="(app)" />
          </Stack.Protected>
          {/* After opening a password-recovery link the user must set a new password first. */}
          <Stack.Protected guard={isSignedIn && isRecoveringPassword}>
            <Stack.Screen name="reset-password" />
          </Stack.Protected>
          {/* Email links (confirmation / recovery) land here in any auth state. */}
          <Stack.Screen name="auth/callback" />
          <Stack.Screen name="language" options={{ presentation: 'modal' }} />
        </Stack>
        <AnimatedSplash ready={ready} />
      </View>
    </ThemeProvider>
  );
}
