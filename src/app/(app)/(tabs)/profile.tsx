import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  AppModal,
  Badge,
  Button,
  Card,
  ListGroup,
  ListItem,
  Screen,
  ScreenHeader,
  Text,
} from '@/components/ui';
import { useAccount, useHasPro } from '@/features/account/hooks';
import { useAuth } from '@/features/auth/auth-provider';
import { usePreferences } from '@/features/preferences/preferences-provider';
import { formatWeight } from '@/lib/units';

function initialsOf(value: string): string {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  const letters =
    parts.length > 1 ? [parts[0]?.[0], parts[parts.length - 1]?.[0]] : [value.trim()[0]];
  return letters.filter(Boolean).join('').toUpperCase() || '?';
}

export default function ProfileScreen() {
  const { t } = useTranslation();
  const { session, isPreview, signOut } = useAuth();
  const { resolvedLanguage, unitSystem } = usePreferences();
  const account = useAccount();
  const { hasPro } = useHasPro();
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  const profile = account.data?.profile;
  const goals = account.data?.goals;
  const name = profile?.displayName || profile?.email || session?.user.email || t('profile.guest');
  const latestWeight = account.data?.latestWeight;

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
          <Text variant="heading" numberOfLines={1} testID="profile-name">
            {name}
          </Text>
          {profile?.email && profile.displayName ? (
            <Text variant="bodySmall" tone="muted" numberOfLines={1}>
              {profile.email}
            </Text>
          ) : null}
          <View className="flex-row gap-2">
            <Badge
              label={hasPro ? t('profile.proPlan') : t('profile.freePlan')}
              tone={hasPro ? 'solid' : 'neutral'}
            />
            {isPreview ? <Badge label={t('auth.preview.badge')} tone="warning" /> : null}
          </View>
        </View>
      </Card>

      <ListGroup title={t('profile.nutrition')}>
        <ListItem
          icon="flag-outline"
          title={t('profile.goals')}
          value={goals ? `${goals.dailyCalorieTarget} ${t('common.kcal')}` : t('home.goalNotSet')}
          onPress={isPreview ? undefined : () => router.push('/goals')}
          testID="profile-goals"
        />
        <ListItem
          icon="scale-outline"
          title={t('profile.weight')}
          value={
            latestWeight ? formatWeight(latestWeight.weightKg, unitSystem, resolvedLanguage) : '—'
          }
          onPress={() => router.push('/progress')}
        />
      </ListGroup>

      <ListGroup>
        <ListItem
          icon="person-outline"
          title={t('profile.editProfile')}
          onPress={isPreview ? undefined : () => router.push('/edit-profile')}
          testID="profile-edit"
        />
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
          icon="shield-outline"
          title={t('profile.account')}
          onPress={isPreview ? undefined : () => router.push('/account')}
          testID="profile-account"
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
    </Screen>
  );
}
