import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  AppModal,
  Badge,
  Button,
  Card,
  InDevelopmentNotice,
  ListGroup,
  ListItem,
  Screen,
  ScreenHeader,
  Text,
} from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { usePreferences } from '@/features/preferences/preferences-provider';

function initialsOf(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  const letters =
    parts.length > 1 ? [parts[0]?.[0], parts[parts.length - 1]?.[0]] : [value.trim()[0]];
  return letters.filter(Boolean).join('').toUpperCase() || '?';
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { session, isPreview, signOut } = useAuth();
  const { resolvedLanguage } = usePreferences();
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [notice, setNotice] = useState(false);

  const metadata = session?.user.user_metadata as { display_name?: string } | undefined;
  const name = metadata?.display_name || session?.user.email || t('profile.guest');

  return (
    <Screen edges={['top']}>
      <ScreenHeader title={t('profile.title')} />

      <Card className="flex-row items-center gap-4">
        <View className="h-16 w-16 items-center justify-center rounded-3xl bg-brand-600">
          <Text variant="heading" tone="white">
            {initialsOf(name)}
          </Text>
        </View>
        <View className="flex-1 gap-1">
          <Text variant="heading" numberOfLines={1}>
            {name}
          </Text>
          {session?.user.email && metadata?.display_name ? (
            <Text variant="bodySmall" tone="muted" numberOfLines={1}>
              {session.user.email}
            </Text>
          ) : null}
          <View className="flex-row gap-2">
            <Badge label={t('profile.freePlan')} tone="neutral" />
            {isPreview ? <Badge label={t('auth.preview.badge')} tone="warning" /> : null}
          </View>
        </View>
      </Card>

      <View className="gap-2">
        <InDevelopmentNotice description={t('profile.bodyDataDescription')} />
      </View>

      <ListGroup>
        <ListItem
          icon="sparkles-outline"
          title={t('profile.subscription')}
          onPress={() => router.push('/paywall')}
        />
        <ListItem
          icon="settings-outline"
          title={t('profile.settings')}
          onPress={() => router.push('/settings')}
        />
        <ListItem
          icon="globe-outline"
          title={t('profile.language')}
          value={t(`language.names.${resolvedLanguage}`)}
          onPress={() => router.push('/language')}
        />
        <ListItem
          icon="help-buoy-outline"
          title={t('profile.help')}
          onPress={() => setNotice(true)}
        />
      </ListGroup>

      <ListGroup>
        <ListItem
          icon="log-out-outline"
          title={isPreview ? t('profile.exitPreview') : t('profile.signOut')}
          destructive
          onPress={() => setConfirmSignOut(true)}
          testID="sign-out"
        />
      </ListGroup>

      <AppModal
        visible={confirmSignOut}
        onClose={() => setConfirmSignOut(false)}
        icon="log-out-outline"
        title={isPreview ? t('profile.exitPreview') : t('profile.signOutConfirmTitle')}
        description={
          isPreview ? t('auth.preview.description') : t('profile.signOutConfirmDescription')
        }
        actions={
          <>
            <Button
              label={isPreview ? t('profile.exitPreview') : t('profile.signOut')}
              variant="danger"
              onPress={() => {
                setConfirmSignOut(false);
                void signOut();
              }}
            />
            <Button
              label={t('common.cancel')}
              variant="ghost"
              onPress={() => setConfirmSignOut(false)}
            />
          </>
        }
      />
      <AppModal
        visible={notice}
        onClose={() => setNotice(false)}
        icon="construct-outline"
        title={t('common.inDevelopment')}
        description={t('common.inDevelopmentDescription')}
        actions={<Button label={t('common.ok')} onPress={() => setNotice(false)} />}
      />
    </Screen>
  );
}
