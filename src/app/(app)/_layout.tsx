import { Stack } from 'expo-router';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';

import { Button, ErrorView, LoadingView } from '@/components/ui';
import { useAccount } from '@/features/account/hooks';
import { useAuth } from '@/features/auth/auth-provider';
import { usePreferences } from '@/features/preferences/preferences-provider';
import { useErrorMessage } from '@/hooks/use-error-message';
import { useTranslation } from 'react-i18next';

/** Applies the account's saved language/units/theme on this device once per sign-in. */
function useApplyRemotePreferences(account: ReturnType<typeof useAccount>['data']) {
  const { setPreference } = usePreferences();
  const appliedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!account || appliedFor.current === account.profile.id) return;
    appliedFor.current = account.profile.id;
    if (!account.profile.onboardingCompletedAt) return;
    setPreference('language', account.profile.language);
    if (account.preferences) {
      setPreference('unitSystem', account.preferences.unitSystem);
      setPreference('theme', account.preferences.theme);
    }
  }, [account, setPreference]);
}

export default function AppLayout() {
  const { t } = useTranslation();
  const { isPreview, signOut } = useAuth();
  const errorMessage = useErrorMessage();
  const account = useAccount();
  useApplyRemotePreferences(account.data);

  if (!isPreview && account.isPending) return <LoadingView />;
  if (!isPreview && account.isError) {
    return (
      <View className="flex-1 justify-center gap-3 bg-neutral-50 px-5 dark:bg-neutral-950">
        <ErrorView message={errorMessage(account.error)} onRetry={() => void account.refetch()} />
        <Button label={t('profile.signOut')} variant="ghost" onPress={() => void signOut()} />
      </View>
    );
  }

  // The questionnaire is required once per account (answers themselves can be skipped).
  const needsSetup = !isPreview && !account.data?.profile.onboardingCompletedAt;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={needsSetup}>
        <Stack.Screen name="setup" />
      </Stack.Protected>
      <Stack.Protected guard={!needsSetup}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add-meal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="create-food" options={{ presentation: 'modal' }} />
        <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
        <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="edit-profile" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="goals" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="account" options={{ animation: 'slide_from_right' }} />
      </Stack.Protected>
    </Stack>
  );
}
