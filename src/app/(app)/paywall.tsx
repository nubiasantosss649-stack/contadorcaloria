import { useState } from 'react';
import { Linking, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { LogoMark } from '@/components/brand/logo-mark';
import { AppModal, Button, Card, Icon, Screen, ScreenHeader, Text } from '@/components/ui';
import { usePreferences } from '@/features/preferences/preferences-provider';
import { PlanCard } from '@/features/subscriptions/components/plan-card';
import { getPlan, PLANS, yearlySavingsPercent, type PlanId } from '@/features/subscriptions/plans';
import { useAppTheme } from '@/hooks/use-app-theme';
import { env } from '@/lib/env';
import { purchasesService } from '@/services/purchases-service';

const FEATURES = ['featureScanner', 'featureInsights', 'featureHistory', 'featureNoAds'] as const;

export default function PaywallScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { resolvedLanguage } = usePreferences();
  const [selected, setSelected] = useState<PlanId>('pro_yearly');
  const [busy, setBusy] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const savings = yearlySavingsPercent(
    getPlan('pro_monthly').displayPriceUsd,
    getPlan('pro_yearly').displayPriceUsd,
  );

  const run = async (action: () => ReturnType<typeof purchasesService.restore>) => {
    setBusy(true);
    const outcome = await action();
    setBusy(false);
    // Phase 1: the service always reports "unavailable" — no purchase is ever simulated.
    if (outcome.status === 'unavailable' || outcome.status === 'error') setUnavailable(true);
  };

  return (
    <Screen
      footer={
        <View className="gap-2">
          <Button
            label={t('paywall.subscribe')}
            icon="sparkles"
            loading={busy}
            disabled={selected === 'free'}
            onPress={() => run(() => purchasesService.purchase(selected))}
            testID="paywall-subscribe"
          />
          <Button
            label={t('paywall.restore')}
            variant="ghost"
            size="md"
            onPress={() => run(() => purchasesService.restore())}
          />
        </View>
      }
    >
      <ScreenHeader showBack closeIcon />
      <View className="items-center gap-4">
        <LogoMark size={72} />
        <View className="gap-2">
          <Text variant="title" center>
            {t('paywall.title')}
          </Text>
          <Text variant="body" tone="muted" center>
            {t('paywall.subtitle')}
          </Text>
        </View>
      </View>

      <Card className="gap-3.5">
        {FEATURES.map((feature) => (
          <View key={feature} className="flex-row items-center gap-3">
            <View className="h-7 w-7 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-950">
              <Icon name="checkmark" size={16} color={colors.primary} />
            </View>
            <Text variant="body" className="flex-1">
              {t(`paywall.${feature}`)}
            </Text>
          </View>
        ))}
      </Card>

      <View className="gap-3" accessibilityRole="radiogroup">
        {PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            locale={resolvedLanguage}
            selected={selected === plan.id}
            isCurrent={plan.id === 'free'}
            savingsPercent={plan.id === 'pro_yearly' ? savings : undefined}
            onSelect={() => setSelected(plan.id)}
          />
        ))}
      </View>

      <View className="gap-2">
        <Text variant="caption" tone="muted" center testID="price-disclaimer">
          {t('paywall.priceDisclaimer')}
        </Text>
        <Text variant="caption" tone="muted" center>
          {t('paywall.legal')}
        </Text>
        <View className="flex-row justify-center gap-4">
          <Text
            variant="caption"
            tone="primary"
            accessibilityRole="link"
            onPress={() =>
              env.termsUrl ? void Linking.openURL(env.termsUrl) : setUnavailable(true)
            }
          >
            {t('paywall.terms')}
          </Text>
          <Text
            variant="caption"
            tone="primary"
            accessibilityRole="link"
            onPress={() =>
              env.privacyUrl ? void Linking.openURL(env.privacyUrl) : setUnavailable(true)
            }
          >
            {t('paywall.privacy')}
          </Text>
        </View>
      </View>

      <AppModal
        visible={unavailable}
        onClose={() => setUnavailable(false)}
        icon="construct-outline"
        title={t('paywall.unavailableTitle')}
        description={t('paywall.unavailableDescription')}
        actions={<Button label={t('common.ok')} onPress={() => setUnavailable(false)} />}
      />
    </Screen>
  );
}
