import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { LogoMark } from '@/components/brand/logo-mark';
import { Button, FadeInView, Icon, PressableScale, Screen, Text } from '@/components/ui';
import { usePreferences } from '@/features/preferences/preferences-provider';
import { useAppTheme } from '@/hooks/use-app-theme';

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { resolvedLanguage, setPreference } = usePreferences();

  return (
    <Screen
      scroll={false}
      footer={
        <FadeInView from="up" delay={300} duration={500} className="gap-3">
          <Button
            label={t('onboarding.welcome.getStarted')}
            icon="arrow-forward"
            iconPosition="right"
            onPress={() => router.push('/features')}
            testID="welcome-get-started"
          />
          <Button
            label={t('onboarding.welcome.haveAccount')}
            variant="ghost"
            onPress={() => setPreference('hasCompletedOnboarding', true)}
          />
        </FadeInView>
      }
    >
      <View className="flex-row justify-end pt-2">
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={t('language.title')}
          onPress={() => router.push('/language')}
          className="flex-row items-center gap-1.5 rounded-full bg-white px-3.5 py-2 dark:bg-neutral-900"
        >
          <Icon name="globe-outline" size={16} color={colors.primary} />
          <Text variant="bodySmall" className="font-inter-medium">
            {t(`language.names.${resolvedLanguage}`)}
          </Text>
        </PressableScale>
      </View>

      <View className="flex-1 justify-center gap-8">
        <FadeInView duration={600}>
          <LogoMark size={88} />
        </FadeInView>
        <FadeInView delay={120} duration={600} className="gap-4">
          <Text variant="label" tone="primary">
            {t('common.appName')}
          </Text>
          <Text variant="display">{t('onboarding.welcome.title')}</Text>
          <Text variant="body" tone="muted" className="text-[17px] leading-[26px]">
            {t('onboarding.welcome.subtitle')}
          </Text>
        </FadeInView>
      </View>
    </Screen>
  );
}
