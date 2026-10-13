import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Badge, Icon, PressableScale, Text } from '@/components/ui';
import { useAppTheme } from '@/hooks/use-app-theme';
import { cn } from '@/lib/cn';

import { formatPrice, type Plan } from '../plans';

const NAME_KEY = {
  free: 'paywall.plans.free',
  pro_monthly: 'paywall.plans.monthly',
  pro_yearly: 'paywall.plans.yearly',
} as const;
const DESCRIPTION_KEY = {
  free: 'paywall.freeDescription',
  pro_monthly: 'paywall.monthlyDescription',
  pro_yearly: 'paywall.yearlyDescription',
} as const;
const PERIOD_KEY = {
  none: 'paywall.forever',
  month: 'paywall.perMonth',
  year: 'paywall.perYear',
} as const;

export type PlanCardProps = {
  plan: Plan;
  selected: boolean;
  isCurrent?: boolean;
  savingsPercent?: number;
  locale: string;
  onSelect: () => void;
};

export function PlanCard({
  plan,
  selected,
  isCurrent = false,
  savingsPercent,
  locale,
  onSelect,
}: PlanCardProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  return (
    <PressableScale
      haptic
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={t(NAME_KEY[plan.id])}
      onPress={onSelect}
      testID={`plan-${plan.id}`}
      className={cn(
        'flex-row items-center gap-4 rounded-3xl border-2 bg-white p-4 dark:bg-neutral-900',
        selected ? 'border-brand-500' : 'border-neutral-100 dark:border-neutral-800',
      )}
    >
      <Icon
        name={selected ? 'radio-button-on' : 'radio-button-off'}
        size={24}
        color={selected ? colors.primary : colors.textMuted}
      />
      <View className="flex-1 gap-1">
        <View className="flex-row flex-wrap items-center gap-2">
          <Text variant="subheading">{t(NAME_KEY[plan.id])}</Text>
          {plan.highlighted ? <Badge label={t('paywall.bestValue')} tone="solid" /> : null}
          {isCurrent ? <Badge label={t('paywall.currentPlan')} tone="neutral" /> : null}
        </View>
        <Text variant="bodySmall" tone="muted">
          {t(DESCRIPTION_KEY[plan.id])}
          {savingsPercent ? ` · ${t('paywall.savePercent', { percent: savingsPercent })}` : ''}
        </Text>
      </View>
      <View className="items-end">
        <Text variant="subheading">{formatPrice(plan.displayPriceUsd, locale)}</Text>
        <Text variant="caption" tone="muted">
          {t(PERIOD_KEY[plan.period])}
        </Text>
      </View>
    </PressableScale>
  );
}
