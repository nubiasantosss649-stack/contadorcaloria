import { Link, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { EmptyState, Screen, Text } from '@/components/ui';

export default function NotFoundScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <Screen scroll={false} contentClassName="items-center justify-center gap-4">
        <EmptyState icon="compass-outline" title={t('common.errorTitle')} />
        <Link href="/">
          <Text tone="primary" className="font-inter-semibold">
            {t('common.back')}
          </Text>
        </Link>
      </Screen>
    </>
  );
}
