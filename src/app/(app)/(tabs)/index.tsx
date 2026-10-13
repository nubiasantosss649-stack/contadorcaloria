import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  Badge,
  Card,
  EmptyState,
  FadeInView,
  Icon,
  PressableScale,
  ProgressBar,
  ProgressRing,
  Screen,
  SectionHeader,
  Text,
  type IconName,
} from '@/components/ui';
import { palette } from '@/constants/palette';
import { macroColors } from '@/constants/theme';
import { useAuth } from '@/features/auth/auth-provider';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useGreetingKey } from '@/hooks/use-greeting-key';

/**
 * Phase 1: there is no meal persistence yet, so today's totals are genuinely zero and the
 * goal is not set. Nothing on this screen is simulated.
 */
const TODAY = { consumedKcal: 0, goalKcal: null as number | null, proteinG: 0, carbsG: 0, fatG: 0 };

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  return (
    <PressableScale
      haptic
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      containerStyle={{ flex: 1 }}
      className="gap-3 rounded-3xl border border-neutral-100 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
    >
      <View className="h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 dark:bg-brand-950">
        <Icon name={icon} size={22} color={colors.primary} />
      </View>
      <Text variant="subheading">{label}</Text>
    </PressableScale>
  );
}

function MacroRow({ label, grams, color }: { label: string; grams: number; color: string }) {
  const { t } = useTranslation();
  return (
    <View className="gap-2">
      <View className="flex-row justify-between">
        <Text variant="bodySmall" className="font-inter-medium">
          {label}
        </Text>
        <Text variant="bodySmall" tone="muted">
          {grams} {t('common.grams')}
        </Text>
      </View>
      <ProgressBar progress={0} color={color} accessibilityLabel={label} />
    </View>
  );
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const greetingKey = useGreetingKey();
  const { session, isPreview } = useAuth();
  const displayName = (session?.user.user_metadata as { display_name?: string } | undefined)
    ?.display_name;
  const progress = TODAY.goalKcal ? TODAY.consumedKcal / TODAY.goalKcal : 0;

  return (
    <Screen edges={['top']}>
      <FadeInView duration={500} className="flex-row items-center justify-between pt-2">
        <View className="flex-1 gap-1">
          <Text variant="bodySmall" tone="muted">
            {t(greetingKey)}
            {displayName ? `, ${displayName}` : ''}
          </Text>
          <Text variant="title">{t('home.today')}</Text>
        </View>
        {isPreview ? <Badge label={t('auth.preview.badge')} tone="warning" /> : null}
      </FadeInView>

      <FadeInView delay={80} duration={500}>
        <Card className="items-center gap-5">
          <ProgressRing progress={progress} accessibilityLabel={t('home.consumed')}>
            <Text variant="number">{TODAY.consumedKcal}</Text>
            <Text variant="caption" tone="muted">
              {t('common.kcal')} · {t('home.consumed')}
            </Text>
          </ProgressRing>
          <View className="w-full flex-row">
            <View className="flex-1 items-center gap-0.5">
              <Text variant="caption" tone="muted">
                {t('home.goal')}
              </Text>
              <Text variant="subheading">{TODAY.goalKcal ?? '—'}</Text>
            </View>
            <View className="w-px bg-neutral-100 dark:bg-neutral-800" />
            <View className="flex-1 items-center gap-0.5">
              <Text variant="caption" tone="muted">
                {t('home.remaining')}
              </Text>
              <Text variant="subheading">
                {TODAY.goalKcal ? TODAY.goalKcal - TODAY.consumedKcal : '—'}
              </Text>
            </View>
          </View>
          {!TODAY.goalKcal ? (
            <View className="w-full gap-1 rounded-2xl bg-neutral-50 p-3 dark:bg-neutral-800">
              <Text variant="bodySmall" className="font-inter-semibold">
                {t('home.goalNotSet')}
              </Text>
              <Text variant="caption" tone="muted">
                {t('home.goalNotSetDescription')}
              </Text>
            </View>
          ) : null}
        </Card>
      </FadeInView>

      <FadeInView delay={160} duration={500} className="gap-3">
        <SectionHeader title={t('home.macros')} />
        <Card className="gap-4">
          <MacroRow
            label={t('macros.protein')}
            grams={TODAY.proteinG}
            color={macroColors.protein}
          />
          <MacroRow label={t('macros.carbs')} grams={TODAY.carbsG} color={macroColors.carbs} />
          <MacroRow label={t('macros.fat')} grams={TODAY.fatG} color={macroColors.fat} />
        </Card>
      </FadeInView>

      <FadeInView delay={240} duration={500} className="gap-3">
        <SectionHeader title={t('home.quickActions')} />
        <View className="flex-row gap-3">
          <QuickAction
            icon="add-circle-outline"
            label={t('home.addMeal')}
            onPress={() => router.push('/add-meal')}
          />
          <QuickAction
            icon="scan-outline"
            label={t('home.scanFood')}
            onPress={() => router.push('/scanner')}
          />
        </View>
      </FadeInView>

      <View className="gap-3">
        <SectionHeader title={t('home.todaysMeals')} />
        <Card padded={false}>
          <EmptyState
            icon="restaurant-outline"
            title={t('home.noMeals')}
            description={t('home.noMealsDescription')}
          />
        </Card>
      </View>

      <PressableScale
        haptic
        accessibilityRole="button"
        accessibilityLabel={t('home.proTitle')}
        onPress={() => router.push('/paywall')}
        className="flex-row items-center gap-4 rounded-3xl bg-brand-600 p-5 dark:bg-brand-700"
      >
        <View className="h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
          <Icon name="sparkles" size={24} color={palette.white} />
        </View>
        <View className="flex-1 gap-0.5">
          <Text variant="subheading" tone="white">
            {t('home.proTitle')}
          </Text>
          <Text variant="bodySmall" style={{ color: palette.emerald[100] }}>
            {t('home.proDescription')}
          </Text>
        </View>
        <Icon name="chevron-forward" size={20} color={palette.white} />
      </PressableScale>
    </Screen>
  );
}
