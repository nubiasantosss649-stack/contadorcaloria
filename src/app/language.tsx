import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { Button, ListGroup, ListItem, Screen, ScreenHeader } from '@/components/ui';
import { usePreferences } from '@/features/preferences/preferences-provider';
import { getDeviceLanguage, SUPPORTED_LANGUAGES } from '@/lib/i18n';

export default function LanguageScreen() {
  const { t } = useTranslation();
  const { language, setPreference } = usePreferences();
  const deviceLanguage = getDeviceLanguage();

  return (
    <Screen
      footer={
        <Button label={t('common.done')} onPress={() => router.back()} testID="language-done" />
      }
    >
      <ScreenHeader
        showBack
        closeIcon
        title={t('language.title')}
        subtitle={t('language.subtitle')}
      />
      <ListGroup>
        <ListItem
          icon="phone-portrait-outline"
          title={t('language.deviceDefault')}
          subtitle={t('language.deviceDefaultDescription', {
            language: t(`language.names.${deviceLanguage}`),
          })}
          selected={language === 'system'}
          onPress={() => setPreference('language', 'system')}
          testID="language-option-system"
        />
        {SUPPORTED_LANGUAGES.map((code) => (
          <ListItem
            key={code}
            title={t(`language.names.${code}`)}
            value={code}
            selected={language === code}
            onPress={() => setPreference('language', code)}
            testID={`language-option-${code}`}
          />
        ))}
      </ListGroup>
    </Screen>
  );
}
