import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import {
  AppModal,
  Button,
  Card,
  ErrorView,
  Icon,
  InDevelopmentNotice,
  ScreenHeader,
  Text,
  TextField,
} from '@/components/ui';
import { useHasPro } from '@/features/account/hooks';
import { useAuth } from '@/features/auth/auth-provider';
import { MealItemEditor } from '@/features/meals/components/meal-item-editor';
import { MealSection } from '@/features/meals/components/meal-section';
import { formatKcal } from '@/features/meals/components/nutrient-text';
import { useCreateFavorite, useDayMeals, useDaySummary } from '@/features/meals/hooks';
import { canViewDay, FREE_HISTORY_DAYS } from '@/features/meals/history';
import { MEAL_TYPES, type MealItem, type MealType } from '@/features/meals/types';
import { usePreferences } from '@/features/preferences/preferences-provider';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useErrorMessage } from '@/hooks/use-error-message';
import { cn } from '@/lib/cn';
import { addDays, dayKey, diffInDays, formatLongDate, startOfDay } from '@/lib/dates';

export default function DiaryScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const errorMessage = useErrorMessage();
  const { resolvedLanguage } = usePreferences();
  const { isPreview } = useAuth();
  const { hasPro } = useHasPro();
  const [date, setDate] = useState(() => startOfDay(new Date()));
  const meals = useDayMeals(date);
  const summary = useDaySummary(meals.data);
  const createFavorite = useCreateFavorite();
  const [editing, setEditing] = useState<MealItem | null>(null);
  const [favoriteFor, setFavoriteFor] = useState<MealType | null>(null);
  const [favoriteName, setFavoriteName] = useState('');

  const offset = diffInDays(new Date(), date);
  const canGoBack = canViewDay(addDays(date, -1), new Date(), hasPro);
  const title =
    offset === 0
      ? t('diary.today')
      : offset === -1
        ? t('diary.yesterday')
        : formatLongDate(date, resolvedLanguage);

  const saveFavorite = () => {
    if (!favoriteFor) return;
    const items = summary.byMeal[favoriteFor].items.map((item) => ({
      foodId: item.food.id,
      grams: item.grams,
    }));
    createFavorite.mutate(
      { name: favoriteName.trim() || t(`meals.${favoriteFor}`), mealType: favoriteFor, items },
      {
        onSuccess: () => {
          setFavoriteFor(null);
          setFavoriteName('');
        },
      },
    );
  };

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-neutral-50 dark:bg-neutral-950">
      <ScrollView
        className="flex-1"
        contentContainerClassName="w-full max-w-[560px] self-center gap-6 px-5 pb-10 pt-2"
        refreshControl={
          <RefreshControl refreshing={meals.isRefetching} onRefresh={() => void meals.refetch()} />
        }
      >
        <ScreenHeader title={t('diary.title')} />

        <Card className="flex-row items-center justify-between py-3">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('diary.previousDay')}
            accessibilityState={{ disabled: !canGoBack }}
            disabled={!canGoBack}
            hitSlop={8}
            onPress={() => setDate((current) => addDays(current, -1))}
            testID="diary-previous"
            className={cn(
              'h-10 w-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800',
              !canGoBack && 'opacity-40',
            )}
          >
            <Icon name="chevron-back" size={20} color={colors.text} />
          </Pressable>
          <View className="items-center">
            <Text variant="subheading" testID="diary-date">
              {title}
            </Text>
            {offset === 0 || offset < -1 ? null : (
              <Text variant="caption" tone="muted">
                {formatLongDate(date, resolvedLanguage)}
              </Text>
            )}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('diary.nextDay')}
            accessibilityState={{ disabled: offset >= 0 }}
            disabled={offset >= 0}
            hitSlop={8}
            onPress={() => setDate((current) => addDays(current, 1))}
            testID="diary-next"
            className={cn(
              'h-10 w-10 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800',
              offset >= 0 && 'opacity-40',
            )}
          >
            <Icon name="chevron-forward" size={20} color={colors.text} />
          </Pressable>
        </Card>

        {isPreview ? <InDevelopmentNotice description={t('home.previewNotice')} /> : null}

        {!canGoBack && !hasPro ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push('/paywall')}
            className="flex-row items-center gap-3 rounded-2xl bg-brand-50 p-4 dark:bg-brand-950"
            testID="diary-history-limit"
          >
            <Icon name="lock-closed-outline" size={20} color={colors.primary} />
            <View className="flex-1">
              <Text variant="bodySmall" className="font-inter-semibold">
                {t('diary.freeLimitTitle', { days: FREE_HISTORY_DAYS })}
              </Text>
              <Text variant="caption" tone="muted">
                {t('diary.freeLimitDescription')}
              </Text>
            </View>
            <Icon name="chevron-forward" size={18} color={colors.primary} />
          </Pressable>
        ) : null}

        {meals.isError ? (
          <ErrorView message={errorMessage(meals.error)} onRetry={() => void meals.refetch()} />
        ) : null}

        <View className="gap-3">
          {MEAL_TYPES.map((mealType) => (
            <MealSection
              key={mealType}
              mealType={mealType}
              items={summary.byMeal[mealType].items}
              totals={summary.byMeal[mealType].totals}
              onAdd={
                isPreview
                  ? undefined
                  : () =>
                      router.push({
                        pathname: '/add-meal',
                        params: { meal: mealType, day: dayKey(date) },
                      })
              }
              onPressItem={setEditing}
              onSaveFavorite={() => setFavoriteFor(mealType)}
            />
          ))}
        </View>

        <View className="flex-row items-center justify-between px-1">
          <Text variant="subheading">{t('diary.dayTotal')}</Text>
          <Text variant="subheading" tone="primary" testID="diary-total">
            {formatKcal(summary.totals.calories, t, resolvedLanguage)}
          </Text>
        </View>
      </ScrollView>

      <MealItemEditor item={editing} onClose={() => setEditing(null)} />
      <AppModal
        visible={favoriteFor !== null}
        onClose={() => setFavoriteFor(null)}
        icon="star-outline"
        title={t('favorites.save')}
        description={t('favorites.saveDescription')}
        actions={
          <>
            <Button
              label={t('common.save')}
              loading={createFavorite.isPending}
              onPress={saveFavorite}
            />
            <Button
              label={t('common.cancel')}
              variant="ghost"
              onPress={() => setFavoriteFor(null)}
            />
          </>
        }
      >
        <TextField
          label={t('favorites.name')}
          value={favoriteName}
          onChangeText={setFavoriteName}
          maxLength={80}
          placeholder={favoriteFor ? t(`meals.${favoriteFor}`) : undefined}
        />
        {createFavorite.error ? (
          <Text variant="bodySmall" tone="danger">
            {errorMessage(createFavorite.error)}
          </Text>
        ) : null}
      </AppModal>
    </SafeAreaView>
  );
}
