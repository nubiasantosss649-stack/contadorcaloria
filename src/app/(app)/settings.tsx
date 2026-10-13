import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  AppModal,
  Button,
  ListGroup,
  ListItem,
  Screen,
  ScreenHeader,
  SegmentedControl,
  Text,
} from '@/components/ui';
import { usePreferences } from '@/features/preferences/preferences-provider';
import type { ThemePreference } from '@/features/preferences/types';
import { env } from '@/lib/env';
import type { UnitSystem } from '@/lib/units';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { theme, unitSystem, resolvedLanguage, setPreference } = usePreferences();
  const [notice, setNotice] = useState(false);

  const openUrl = (url: string | undefined) => {
    if (url) void Linking.openURL(url);
    else setNotice(true);
  };

  return (
    <Screen>
      <ScreenHeader showBack title={t('settings.title')} />

      <View className="gap-2">
        <Text variant="label" tone="muted" className="px-1">
          {t('settings.appearance')}
        </Text>
        <SegmentedControl<ThemePreference>
          accessibilityLabel={t('settings.appearance')}
          value={theme}
          onChange={(value) => setPreference('theme', value)}
          options={[
            { value: 'system', label: t('settings.themeSystem') },
            { value: 'light', label: t('settings.themeLight') },
            { value: 'dark', label: t('settings.themeDark') },
          ]}
        />
      </View>

      <ListGroup title={t('settings.preferences')}>
        <ListItem
          icon="globe-outline"
          title={t('settings.language')}
          value={t(`language.names.${resolvedLanguage}`)}
          onPress={() => router.push('/language')}
        />
        <ListItem
          icon="notifications-outline"
          title={t('settings.notifications')}
          value={t('common.inDevelopment')}
          onPress={() => setNotice(true)}
        />
      </ListGroup>

      <ListGroup title={t('settings.units')}>
        {(['metric', 'imperial'] as const satisfies readonly UnitSystem[]).map((system) => (
          <ListItem
            key={system}
            title={t(`settings.${system}`)}
            selected={unitSystem === system}
            onPress={() => setPreference('unitSystem', system)}
            testID={`units-${system}`}
          />
        ))}
      </ListGroup>

      <ListGroup title={t('settings.legal')}>
        <ListItem
          icon="document-text-outline"
          title={t('settings.terms')}
          onPress={() => openUrl(env.termsUrl)}
        />
        <ListItem
          icon="shield-checkmark-outline"
          title={t('settings.privacy')}
          onPress={() => openUrl(env.privacyUrl)}
        />
      </ListGroup>

      <ListGroup title={t('settings.account')}>
        <ListItem
          icon="trash-outline"
          title={t('settings.deleteAccount')}
          destructive
          onPress={() => setNotice(true)}
        />
      </ListGroup>

      <ListGroup title={t('settings.about')}>
        <ListItem title={t('settings.version')} value={Constants.expoConfig?.version ?? '—'} />
        <ListItem title={t('settings.environment')} value={env.appEnv} />
      </ListGroup>

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
