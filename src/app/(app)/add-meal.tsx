import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  Button,
  Card,
  EmptyState,
  Icon,
  InDevelopmentNotice,
  ListGroup,
  LoadingView,
  Screen,
  ScreenHeader,
  SegmentedControl,
  Text,
  TextField,
} from '@/components/ui';
import { useAuth } from '@/features/auth/auth-provider';
import { FoodRow } from '@/features/meals/components/food-row';
import { formatKcal } from '@/features/meals/components/nutrient-text';
import { PortionModal } from '@/features/meals/components/portion-modal';
import {
  useAddMealItems,
  useCreateFavorite,
  useDeleteFavorite,
  useFavorites,
  useFoodSearch,
  useRecentFoods,
} from '@/features/meals/hooks';
import { takePendingFood } from '@/features/meals/pending-food';
import {
  isMealType,
  MEAL_TYPES,
  mealTypeForHour,
  type Food,
  type MealType,
} from '@/features/meals/types';
import { usePreferences } from '@/features/preferences/preferences-provider';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useErrorMessage } from '@/hooks/use-error-message';
import { consumedAtFor, diffInDays, formatLongDate, fromDayKey } from '@/lib/dates';
import { calculateNutrients, sumNutrients } from '@/lib/nutrition';

type BasketItem = { key: string; food: Food; grams: number };

export default function AddMealScreen() {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const errorMessage = useErrorMessage();
  const { resolvedLanguage } = usePreferences();
  const { isBackendConfigured } = useAuth();
  const params = useLocalSearchParams<{ meal?: string; day?: string }>();
  const day = useMemo(() => (params.day ? fromDayKey(params.day) : new Date()), [params.day]);
  const [mealType, setMealType] = useState<MealType>(() =>
    isMealType(params.meal) ? params.meal : mealTypeForHour(new Date().getHours()),
  );
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'recent' | 'favorites'>('recent');
  const [basket, setBasket] = useState<BasketItem[]>([]);
  const [selected, setSelected] = useState<Food | null>(null);
  const [saveAsFavorite, setSaveAsFavorite] = useState(false);
  const [favoriteName, setFavoriteName] = useState('');

  const debounced = useDebouncedValue(query, 300);
  const search = useFoodSearch(debounced);
  const recent = useRecentFoods();
  const favorites = useFavorites();
  const addItems = useAddMealItems();
  const createFavorite = useCreateFavorite();
  const deleteFavorite = useDeleteFavorite();

  // Pick up a food created in the "create food" screen.
  useFocusEffect(
    useCallback(() => {
      const created = takePendingFood();
      if (created) setSelected(created);
    }, []),
  );

  const totals = sumNutrients(
    basket.map((item) =>
      calculateNutrients(
        {
          calories: item.food.caloriesPer100g,
          protein: item.food.proteinPer100g,
          carbs: item.food.carbsPer100g,
          fat: item.food.fatPer100g,
        },
        item.grams,
      ),
    ),
  );

  const addToBasket = (food: Food, grams: number) =>
    setBasket((items) => [
      ...items,
      { key: `${food.id}-${Date.now()}-${items.length}`, food, grams },
    ]);

  const save = () => {
    const items = basket.map((item) => ({ foodId: item.food.id, grams: item.grams }));
    addItems.mutate(
      { mealType, consumedAt: consumedAtFor(day), items },
      {
        onSuccess: () => {
          if (saveAsFavorite && favoriteName.trim()) {
            createFavorite.mutate({ name: favoriteName, mealType, items });
          }
          router.back();
        },
      },
    );
  };

  const dayOffset = diffInDays(new Date(), day);
  const dayLabel = dayOffset === 0 ? t('diary.today') : formatLongDate(day, resolvedLanguage);
  const searching = debounced.trim().length >= 2;

  if (!isBackendConfigured) {
    return (
      <Screen>
        <ScreenHeader showBack closeIcon title={t('addMeal.title')} />
        <InDevelopmentNotice description={t('home.previewNotice')} />
      </Screen>
    );
  }

  return (
    <Screen
      keyboard
      footer={
        <View className="gap-2">
          {addItems.error ? (
            <Text variant="bodySmall" tone="danger" center>
              {errorMessage(addItems.error)}
            </Text>
          ) : null}
          <Button
            label={
              basket.length > 0
                ? t('addMeal.saveWithTotal', {
                    count: basket.length,
                    kcal: Math.round(totals.calories),
                  })
                : t('addMeal.save')
            }
            icon="checkmark"
            onPress={save}
            loading={addItems.isPending}
            disabled={basket.length === 0}
            testID="add-meal-save"
          />
        </View>
      }
    >
      <ScreenHeader showBack closeIcon title={t('addMeal.title')} subtitle={dayLabel} />

      <View className="gap-2">
        <Text variant="label" tone="muted" className="px-1">
          {t('addMeal.mealType')}
        </Text>
        <SegmentedControl<MealType>
          accessibilityLabel={t('addMeal.mealType')}
          value={mealType}
          onChange={setMealType}
          options={MEAL_TYPES.map((value) => ({ value, label: t(`meals.${value}`) }))}
        />
      </View>

      {basket.length > 0 ? (
        <Card className="gap-3" testID="add-meal-basket">
          <View className="flex-row items-center justify-between">
            <Text variant="subheading">{t('addMeal.selected')}</Text>
            <Text variant="subheading" tone="primary">
              {formatKcal(totals.calories, t, resolvedLanguage)}
            </Text>
          </View>
          {basket.map((item) => (
            <View key={item.key} className="flex-row items-center gap-3">
              <View className="flex-1">
                <Text variant="body" numberOfLines={1}>
                  {item.food.name}
                </Text>
                <Text variant="caption" tone="muted">
                  {item.grams} {t('common.grams')}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('diary.delete')}
                hitSlop={8}
                onPress={() => setBasket((items) => items.filter((i) => i.key !== item.key))}
              >
                <Icon name="close-circle" size={22} color={colors.textMuted} />
              </Pressable>
            </View>
          ))}
          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: saveAsFavorite }}
            onPress={() => setSaveAsFavorite((v) => !v)}
            className="flex-row items-center gap-2 pt-1"
          >
            <Icon
              name={saveAsFavorite ? 'checkbox' : 'square-outline'}
              size={22}
              color={saveAsFavorite ? colors.primary : colors.textMuted}
            />
            <Text variant="bodySmall">{t('favorites.saveAlso')}</Text>
          </Pressable>
          {saveAsFavorite ? (
            <TextField
              label={t('favorites.name')}
              value={favoriteName}
              onChangeText={setFavoriteName}
              maxLength={80}
              placeholder={t(`meals.${mealType}`)}
            />
          ) : null}
        </Card>
      ) : null}

      <TextField
        label={t('addMeal.searchPlaceholder')}
        placeholder={t('addMeal.searchExample')}
        icon="search-outline"
        value={query}
        onChangeText={setQuery}
        autoCorrect={false}
        returnKeyType="search"
        testID="add-meal-search"
      />

      {searching ? (
        search.isPending ? (
          <LoadingView />
        ) : search.isError ? (
          <Text tone="danger">{errorMessage(search.error)}</Text>
        ) : search.data && search.data.length > 0 ? (
          <ListGroup>
            {search.data.map((food) => (
              <FoodRow key={food.id} food={food} onPress={() => setSelected(food)} />
            ))}
          </ListGroup>
        ) : (
          <Card padded={false}>
            <EmptyState
              icon="search-outline"
              title={t('addMeal.noResults')}
              description={t('addMeal.noResultsHint')}
            />
          </Card>
        )
      ) : (
        <View className="gap-3">
          <SegmentedControl<'recent' | 'favorites'>
            accessibilityLabel={t('addMeal.title')}
            value={tab}
            onChange={setTab}
            options={[
              { value: 'recent', label: t('addMeal.recent') },
              { value: 'favorites', label: t('favorites.title') },
            ]}
          />
          {tab === 'recent' ? (
            recent.data && recent.data.length > 0 ? (
              <ListGroup>
                {recent.data.map((food) => (
                  <FoodRow key={food.id} food={food} onPress={() => setSelected(food)} />
                ))}
              </ListGroup>
            ) : (
              <Card padded={false}>
                <EmptyState icon="time-outline" title={t('addMeal.noRecent')} />
              </Card>
            )
          ) : favorites.data && favorites.data.length > 0 ? (
            <ListGroup>
              {favorites.data.map((favorite) => (
                <View key={favorite.id} className="flex-row items-center gap-3 px-4 py-3">
                  <Pressable
                    className="flex-1 gap-0.5"
                    accessibilityRole="button"
                    onPress={() =>
                      favorite.items.forEach((item) => addToBasket(item.food, item.grams))
                    }
                    testID={`favorite-${favorite.id}`}
                  >
                    <Text variant="body" className="font-inter-medium">
                      {favorite.name}
                    </Text>
                    <Text variant="caption" tone="muted">
                      {t('favorites.itemCount', { count: favorite.items.length })}
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={t('favorites.delete')}
                    hitSlop={8}
                    onPress={() => deleteFavorite.mutate(favorite.id)}
                  >
                    <Icon name="trash-outline" size={20} color={colors.textMuted} />
                  </Pressable>
                </View>
              ))}
            </ListGroup>
          ) : (
            <Card padded={false}>
              <EmptyState
                icon="star-outline"
                title={t('favorites.empty')}
                description={t('favorites.emptyHint')}
              />
            </Card>
          )}
        </View>
      )}

      <Button
        label={t('foods.create')}
        variant="outline"
        icon="create-outline"
        onPress={() => router.push({ pathname: '/create-food', params: { name: query.trim() } })}
        testID="add-meal-create-food"
      />
      <Text variant="caption" tone="muted" center>
        {t('addMeal.databaseNote')}
      </Text>

      <PortionModal
        food={selected}
        onCancel={() => setSelected(null)}
        onConfirm={(grams) => {
          if (selected) addToBasket(selected, grams);
          setSelected(null);
          setQuery('');
        }}
      />
    </Screen>
  );
}
