import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Button,
  ListGroup,
  ListItem,
  Screen,
  ScreenHeader,
  Text,
  TextField,
} from '@/components/ui';
import { COUNTRIES } from '@/constants/countries';
import { useAccount, useUpdateProfile } from '@/features/account/hooks';
import { usePreferences } from '@/features/preferences/preferences-provider';
import { useErrorMessage } from '@/hooks/use-error-message';

export default function EditProfileScreen() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const { resolvedLanguage } = usePreferences();
  const account = useAccount();
  const update = useUpdateProfile();
  const [name, setName] = useState(account.data?.profile.displayName ?? '');
  const [country, setCountry] = useState<string | null>(account.data?.profile.country ?? null);
  const [showCountries, setShowCountries] = useState(false);
  const nameError = name.trim().length === 0 ? t('auth.errors.nameRequired') : null;

  return (
    <Screen
      keyboard
      footer={
        <Button
          label={t('common.save')}
          disabled={Boolean(nameError)}
          loading={update.isPending}
          testID="edit-profile-save"
          onPress={() =>
            update.mutate({ displayName: name, country }, { onSuccess: () => router.back() })
          }
        />
      }
    >
      <ScreenHeader showBack title={t('profile.editProfile')} />
      <TextField
        label={t('auth.register.name')}
        value={name}
        onChangeText={setName}
        maxLength={80}
        autoComplete="name"
        error={nameError}
        testID="edit-profile-name"
      />
      <ListGroup title={t('setup.fields.country')}>
        <ListItem
          title={
            COUNTRIES.find((c) => c.code === country)?.names[resolvedLanguage] ??
            t('setup.notInformed')
          }
          onPress={() => setShowCountries((v) => !v)}
        />
      </ListGroup>
      {showCountries ? (
        <ListGroup>
          {COUNTRIES.map((c) => (
            <ListItem
              key={c.code}
              title={c.names[resolvedLanguage]}
              selected={country === c.code}
              onPress={() => {
                setCountry(c.code);
                setShowCountries(false);
              }}
            />
          ))}
        </ListGroup>
      ) : null}
      {update.error ? (
        <Text variant="bodySmall" tone="danger" center>
          {errorMessage(update.error)}
        </Text>
      ) : null}
    </Screen>
  );
}
