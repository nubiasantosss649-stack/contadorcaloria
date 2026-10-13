import { router } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import {
  Badge,
  Card,
  ErrorView,
  FadeInView,
  Icon,
  InDevelopmentNotice,
  PressableScale,
  ProgressBar,
  ProgressRing,
  SectionHeader,
  Text,
  type IconName,
} from '@/components/ui';
import { palette } from '@/constants/palette';
import { macroColors } from '@/constants/theme';
import { useAccount } from '@/features/account/hooks';
import { useAuth } from '@/features/auth/auth-provider';
import { MealItemEditor } from '@/features/meals/components/meal-item-editor';
import { MealSection } from '@/features/meals/components/meal-section';
import { formatGrams } from '@/features/meals/components/nutrient-text';
import { useDayMeals, useDaySummary } from '@/features/meals/hooks';
import { MEAL_TYPES, type MealItem, type MealType } from '@/features/meals/types';
import { usePreferences } from '@/features/preferences/preferences-provider';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useErrorMessage } from '@/hooks/use-error-message';
import { useGreetingKey } from '@/hooks/use-greeting-key';
import { dayKey } from '@/lib/dates';
import { progressRatio, remainingCalories } from '@/lib/nutrition';

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

function MacroRow({
  label,
  grams,
  target,
  color,
  testID,
}: {
  label: string;
  grams: number;
  target: number | null;
  color: string;
  testID: string;
}) {
  const { t } = useTranslation();
  const { resolvedLanguage } = usePreferences();
  return (
    <View className="gap-2" testID={testID}>
      <View className="flex-row justify-between">
        <Text variant="bodySmall" className="font-inter-medium">
          {label}
        </Text>
        <Text variant="bodySmall" tone="muted">
          {formatGrams(grams, t, resolvedLanguage)}
          {target ? ` / ${formatGrams(target, t, resolvedLanguage)}` : ''}
        </Text>
      </View>
      <ProgressBar
        progress={progressRatio(grams, target)}
        color={color}
        accessibilityLabel={label}
      />
    </View>
  );
}

export default function HomeScreen() {
  const { t } = useTranslation();
  const greetingKey = useGreetingKey();
  const errorMessage = useErrorMessage();
  const { isPreview } = useAuth();
  const account = useAccount();
  const [today] = useState(() => new Date());
  const meals = useDayMeals(today);
  const summary = useDaySummary(meals.data);
  const [editing, setEditing] = useState<MealItem | null>(null);

  const goals = account.data?.goals ?? null;
  const target = goals?.dailyCalorieTarget ?? null;
  const consumed = Math.round(summary.totals.calories);
  const remaining = remainingCalories(target, consumed);
  const displayName = account.data?.profile.displayName;
  const incomplete = Object.values(summary.totals.incomplete).some(Boolean);

  const addTo = (mealType: MealType) =>
    router.push({ pathname: '/add-meal', params: { meal: mealType, day: dayKey(today) } });

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      <ScrollView
        className="flex-1"
        contentContainerClassName="w-full max-w-[560px] self-center gap-6 px-5 pb-10 pt-2"
        refreshControl={
          <RefreshControl
            refreshing={meals.isRefetching}
            onRefresh={() => {
              void meals.refetch();
              void account.refetch();
            }}
          />
        }
      >
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

        {isPreview ? <InDevelopmentNotice description={t('home.previewNotice')} /> : null}
        {meals.isError ? (
          <ErrorView message={errorMessage(meals.error)} onRetry={() => void meals.refetch()} />
        ) : null}

        <FadeInView delay={80} duration={500}>
          <Card className="items-center gap-5">
            <ProgressRing
              progress={progressRatio(consumed, target)}
              accessibilityLabel={t('home.consumed')}
              color={remaining !== null && remaining < 0 ? palette.warning[500] : undefined}
            >
              <Text variant="number" testID="home-consumed">
                {consumed}
              </Text>
              <Text variant="caption" tone="muted">
                {t('common.kcal')} · {t('home.consumed')}
              </Text>
            </ProgressRing>
            <View className="w-full flex-row">
              <View className="flex-1 items-center gap-0.5">
                <Text variant="caption" tone="muted">
                  {t('home.goal')}
                </Text>
                <Text variant="subheading" testID="home-goal">
                  {target ?? '—'}
                </Text>
              </View>
              <View className="w-px bg-neutral-100 dark:bg-neutral-800" />
              <View className="flex-1 items-center gap-0.5">
                <Text variant="caption" tone="muted">
                  {remaining !== null && remaining < 0 ? t('home.over') : t('home.remaining')}
                </Text>
                <Text
                  variant="subheading"
                  tone={remaining !== null && remaining < 0 ? 'warning' : 'default'}
                  testID="home-remaining"
                >
                  {remaining === null ? '—' : Math.abs(remaining)}
                </Text>
              </View>
            </View>
            {target === null && !isPreview ? (
              <PressableScale
                accessibilityRole="button"
                onPress={() => router.push('/goals')}
                containerStyle={{ alignSelf: 'stretch' }}
                className="w-full gap-1 rounded-2xl bg-neutral-50 p-3 dark:bg-neutral-800"
              >
                <Text variant="bodySmall" className="font-inter-semibold">
                  {t('home.goalNotSet')}
                </Text>
                <Text variant="caption" tone="primary">
                  {t('home.setGoal')}
                </Text>
              </PressableScale>
            ) : null}
          </Card>
        </FadeInView>

        <FadeInView delay={160} duration={500} className="gap-3">
          <SectionHeader title={t('home.macros')} />
          <Card className="gap-4">
            <MacroRow
              label={t('macros.protein')}
              grams={summary.totals.protein ?? 0}
              target={goals?.proteinTarget ?? null}
              color={macroColors.protein}
              testID="home-protein"
            />
            <MacroRow
              label={t('macros.carbs')}
              grams={summary.totals.carbs ?? 0}
              target={goals?.carbTarget ?? null}
              color={macroColors.carbs}
              testID="home-carbs"
            />
            <MacroRow
              label={t('macros.fat')}
              grams={summary.totals.fat ?? 0}
              target={goals?.fatTarget ?? null}
              color={macroColors.fat}
              testID="home-fat"
            />
            {incomplete ? (
              <Text variant="caption" tone="muted">
                {t('home.incompleteMacros')}
              </Text>
            ) : null}
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
          <SectionHeader
            title={t('home.todaysMeals')}
            right={
              <Text variant="caption" tone="muted" testID="home-item-count">
                {t('home.itemCount', { count: summary.itemCount })}
              </Text>
            }
          />
          {MEAL_TYPES.map((mealType) => (
            <MealSection
              key={mealType}
              mealType={mealType}
              items={summary.byMeal[mealType].items}
              totals={summary.byMeal[mealType].totals}
              onAdd={isPreview ? undefined : () => addTo(mealType)}
              onPressItem={setEditing}
            />
          ))}
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
      </ScrollView>
      <MealItemEditor item={editing} onClose={() => setEditing(null)} />
    </SafeAreaView>
  );
}
