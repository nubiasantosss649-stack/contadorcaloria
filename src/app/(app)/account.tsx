import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  AppModal,
  Button,
  ListGroup,
  ListItem,
  Screen,
  ScreenHeader,
  Text,
  TextField,
} from '@/components/ui';
import { countryName } from '@/constants/countries';
import { useAccount, useHasPro } from '@/features/account/hooks';
import { useAuth } from '@/features/auth/auth-provider';
import { usePreferences } from '@/features/preferences/preferences-provider';
import { authService } from '@/services/auth-service';

/** Account information and permanent deletion. */
export default function AccountScreen() {
  const { t } = useTranslation();
  const { resolvedLanguage } = usePreferences();
  const { signOut } = useAuth();
  const account = useAccount();
  const { hasPro } = useHasPro();
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const profile = account.data?.profile;
  const confirmWord = t('account.deleteConfirmWord');
  const canDelete = confirmText.trim().toUpperCase() === confirmWord.toUpperCase();

  const deleteAccount = async () => {
    setDeleting(true);
    setError(null);
    const result = await authService.deleteAccount();
    setDeleting(false);
    if (!result.ok) return setError(t('account.deleteFailed'));
    // The session is already cleared; this also resets the in-memory state.
    await signOut();
  };

  return (
    <Screen keyboard>
      <ScreenHeader showBack title={t('account.title')} />
      <ListGroup>
        <ListItem title={t('auth.email')} value={profile?.email ?? '—'} />
        <ListItem
          title={t('account.memberSince')}
          value={
            profile
              ? new Intl.DateTimeFormat(resolvedLanguage, { dateStyle: 'medium' }).format(
                  new Date(profile.createdAt),
                )
              : '—'
          }
        />
        <ListItem
          title={t('setup.fields.country')}
          value={countryName(profile?.country ?? null, resolvedLanguage) ?? '—'}
        />
        <ListItem
          title={t('profile.subscription')}
          value={hasPro ? t('profile.proPlan') : t('profile.freePlan')}
        />
      </ListGroup>

      <ListGroup title={t('account.dangerZone')}>
        <ListItem
          icon="trash-outline"
          title={t('settings.deleteAccount')}
          subtitle={t('account.deleteSubtitle')}
          destructive
          onPress={() => setConfirming(true)}
          testID="account-delete"
        />
      </ListGroup>

      <AppModal
        visible={confirming}
        onClose={() => setConfirming(false)}
        icon="warning-outline"
        title={t('account.deleteTitle')}
        description={t('account.deleteDescription')}
        actions={
          <>
            <Button
              label={t('settings.deleteAccount')}
              variant="danger"
              disabled={!canDelete}
              loading={deleting}
              onPress={deleteAccount}
              testID="account-delete-confirm"
            />
            <Button
              label={t('common.cancel')}
              variant="ghost"
              onPress={() => setConfirming(false)}
            />
          </>
        }
      >
        <View className="gap-2">
          <TextField
            label={t('account.typeToConfirm', { word: confirmWord })}
            value={confirmText}
            onChangeText={setConfirmText}
            autoCapitalize="characters"
            autoCorrect={false}
            testID="account-delete-input"
          />
          {hasPro ? (
            <Text variant="caption" tone="warning">
              {t('account.cancelSubscriptionNote')}
            </Text>
          ) : null}
          {error ? (
            <Text variant="bodySmall" tone="danger">
              {error}
            </Text>
          ) : null}
        </View>
      </AppModal>
    </Screen>
  );
}
