import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  AppModal,
  BarChart,
  Button,
  Card,
  EmptyState,
  InDevelopmentNotice,
  Screen,
  ScreenHeader,
  SectionHeader,
  SegmentedControl,
  Text,
  type BarDatum,
} from '@/components/ui';
import { WeightInput } from '@/features/account/components/measurement-inputs';
import { useAccount, useLogWeight, useWeights } from '@/features/account/hooks';
import { useAuth } from '@/features/auth/auth-provider';
import { useMealsRange, summarizeDay } from '@/features/meals/hooks';
import { usePreferences } from '@/features/preferences/preferences-provider';
import { useErrorMessage } from '@/hooks/use-error-message';
import { addDays, dayKey, startOfDay } from '@/lib/dates';
import { isValidWeightKg } from '@/lib/energy';
import { formatWeight, kgToLb, roundTo } from '@/lib/units';

type Range = 'week' | 'month' | 'year';
const RANGE_DAYS: Record<Range, number> = { week: 7, month: 30, year: 365 };

export default function ProgressScreen() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const { isPreview } = useAuth();
  const { unitSystem, resolvedLanguage } = usePreferences();
  const account = useAccount();
  const [range, setRange] = useState<Range>('month');
  const [logging, setLogging] = useState(false);
  const [newWeight, setNewWeight] = useState<number | null>(null);
  const logWeight = useLogWeight();

  const today = useMemo(() => startOfDay(new Date()), []);
  const since = useMemo(() => addDays(today, -RANGE_DAYS[range]).toISOString(), [today, range]);
  const weights = useWeights(since);

  // Calories: last 7 days (the Free plan's history window).
  const weekFrom = useMemo(() => addDays(today, -6), [today]);
  const meals = useMealsRange(weekFrom.toISOString(), addDays(today, 1).toISOString());

  const weightSeries: BarDatum[] = useMemo(
    () =>
      (weights.data ?? []).slice(-14).map((log) => ({
        label: new Intl.DateTimeFormat(resolvedLanguage, {
          day: 'numeric',
          month: 'numeric',
        }).format(new Date(log.recordedAt)),
        value: roundTo(unitSystem === 'imperial' ? kgToLb(log.weightKg) : log.weightKg, 1),
      })),
    [weights.data, unitSystem, resolvedLanguage],
  );

  const calorieSeries: BarDatum[] = useMemo(() => {
    if (!meals.data) return [];
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(weekFrom, i);
      const key = dayKey(day);
      const entries = meals.data.filter((entry) => dayKey(new Date(entry.consumedAt)) === key);
      return {
        label: new Intl.DateTimeFormat(resolvedLanguage, { weekday: 'narrow' }).format(day),
        value: Math.round(summarizeDay(entries).totals.calories),
      };
    });
  }, [meals.data, weekFrom, resolvedLanguage]);

  const hasCalories = calorieSeries.some((d) => d.value > 0);
  const target = account.data?.goals?.dailyCalorieTarget;
  const latest = account.data?.latestWeight ?? null;
  const first = weights.data?.[0];
  const change = latest && first ? latest.weightKg - first.weightKg : null;

  return (
    <Screen edges={['top']}>
      <ScreenHeader title={t('progress.title')} />
      {isPreview ? <InDevelopmentNotice description={t('home.previewNotice')} /> : null}

      <SectionHeader title={t('progress.weight')} />
      <Card className="flex-row justify-between">
        <View className="gap-0.5">
          <Text variant="caption" tone="muted">
            {t('progress.current')}
          </Text>
          <Text variant="heading" testID="progress-latest-weight">
            {latest ? formatWeight(latest.weightKg, unitSystem, resolvedLanguage) : '—'}
          </Text>
        </View>
        <View className="items-end gap-0.5">
          <Text variant="caption" tone="muted">
            {t('progress.change')}
          </Text>
          <Text variant="heading">
            {change === null || !weights.data || weights.data.length < 2
              ? '—'
              : `${change > 0 ? '+' : ''}${formatWeight(change, unitSystem, resolvedLanguage)}`}
          </Text>
        </View>
      </Card>

      <SegmentedControl<Range>
        accessibilityLabel={t('progress.title')}
        value={range}
        onChange={setRange}
        options={[
          { value: 'week', label: t('progress.week') },
          { value: 'month', label: t('progress.month') },
          { value: 'year', label: t('progress.year') },
        ]}
      />
      <Card padded={weightSeries.length > 0}>
        {weights.isError ? (
          <Text tone="danger">{errorMessage(weights.error)}</Text>
        ) : weightSeries.length > 0 ? (
          <BarChart data={weightSeries} accessibilityLabel={t('progress.weight')} />
        ) : (
          <EmptyState
            icon="scale-outline"
            title={t('progress.noData')}
            description={t('progress.noWeightHint')}
          />
        )}
      </Card>
      <Button
        label={t('progress.logWeight')}
        variant="secondary"
        icon="add"
        disabled={isPreview}
        onPress={() => {
          setNewWeight(latest?.weightKg ?? null);
          setLogging(true);
        }}
        testID="progress-log-weight"
      />

      <SectionHeader title={t('progress.caloriesLast7')} />
      <Card padded={hasCalories}>
        {hasCalories ? (
          <BarChart
            data={calorieSeries}
            target={target}
            accessibilityLabel={t('progress.calories')}
          />
        ) : (
          <EmptyState
            icon="flame-outline"
            title={t('progress.noData')}
            description={t('progress.noCaloriesHint')}
          />
        )}
      </Card>

      <AppModal
        visible={logging}
        onClose={() => setLogging(false)}
        icon="scale-outline"
        title={t('progress.logWeight')}
        actions={
          <>
            <Button
              label={t('common.save')}
              disabled={!isValidWeightKg(newWeight)}
              loading={logWeight.isPending}
              testID="weight-save"
              onPress={() =>
                newWeight !== null &&
                logWeight.mutate(newWeight, { onSuccess: () => setLogging(false) })
              }
            />
            <Button label={t('common.cancel')} variant="ghost" onPress={() => setLogging(false)} />
          </>
        }
      >
        <WeightInput
          label={t('setup.fields.weight')}
          value={newWeight}
          onChange={setNewWeight}
          unitSystem={unitSystem}
          error={
            newWeight !== null && !isValidWeightKg(newWeight) ? t('setup.errors.weight') : null
          }
          testID="weight-input"
        />
        {logWeight.error ? (
          <Text variant="bodySmall" tone="danger">
            {errorMessage(logWeight.error)}
          </Text>
        ) : null}
      </AppModal>
    </Screen>
  );
}
