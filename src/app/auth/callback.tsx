import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, EmptyState, LoadingView, Screen } from '@/components/ui';
import { authService } from '@/services/auth-service';

/**
 * Landing route for email links (sign-up confirmation and password recovery).
 * Supabase appends `code` (PKCE) or `token_hash` + `type` to the redirect URL.
 */
export default function AuthCallbackScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<Record<string, string>>();
  const [failed, setFailed] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const query = new URLSearchParams(
      Object.entries(params).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string',
      ),
    ).toString();
    void authService.completeRedirect(`caloriafacil://auth/callback?${query}`).then((result) => {
      if (!result.ok) return setFailed(true);
      // Recovery opens the "new password" screen through the auth guard; otherwise go home.
      router.replace(result.data.recovery ? '/reset-password' : '/');
    });
  }, [params]);

  if (!failed) return <LoadingView />;

  return (
    <Screen scroll={false} contentClassName="justify-center">
      <View className="gap-4">
        <EmptyState
          icon="link-outline"
          title={t('auth.callback.invalidTitle')}
          description={t('auth.callback.invalidDescription')}
        />
        <Button label={t('auth.forgot.backToLogin')} onPress={() => router.replace('/login')} />
      </View>
    </Screen>
  );
}
