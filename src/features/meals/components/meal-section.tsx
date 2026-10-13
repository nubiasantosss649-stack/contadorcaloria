import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Card, Icon, Text } from '@/components/ui';
import { usePreferences } from '@/features/preferences/preferences-provider';
import { useAppTheme } from '@/hooks/use-app-theme';
import type { NutrientTotals } from '@/lib/nutrition';

import type { MealItem, MealType } from '../types';
import { formatKcal } from './nutrient-text';

export type MealSectionProps = {
  mealType: MealType;
  items: MealItem[];
  totals: NutrientTotals;
  onAdd?: () => void;
  onPressItem?: (item: MealItem) => void;
  onSaveFavorite?: () => void;
};

/** One meal (breakfast, lunch…) with its items and calorie total. */
export function MealSection({
  mealType,
  items,
  totals,
  onAdd,
  onPressItem,
  onSaveFavorite,
}: MealSectionProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { resolvedLanguage } = usePreferences();

  return (
    <Card className="gap-3" testID={`meal-section-${mealType}`}>
      <View className="flex-row items-center justify-between">
        <View className="gap-0.5">
          <Text variant="subheading">{t(`meals.${mealType}`)}</Text>
          <Text variant="caption" tone="muted" testID={`meal-total-${mealType}`}>
            {formatKcal(totals.calories, t, resolvedLanguage)}
          </Text>
        </View>
        <View className="flex-row gap-2">
          {onSaveFavorite && items.length > 0 ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('favorites.save')}
              hitSlop={8}
              onPress={onSaveFavorite}
              className="h-9 w-9 items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-800"
            >
              <Icon name="star-outline" size={18} color={colors.primary} />
            </Pressable>
          ) : null}
          {onAdd ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${t('home.addMeal')} · ${t(`meals.${mealType}`)}`}
              hitSlop={8}
              onPress={onAdd}
              testID={`meal-add-${mealType}`}
              className="h-9 w-9 items-center justify-center rounded-full bg-brand-50 dark:bg-brand-950"
            >
              <Icon name="add" size={20} color={colors.primary} />
            </Pressable>
          ) : null}
        </View>
      </View>
      {items.length === 0 ? (
        <Text variant="bodySmall" tone="muted">
          {t('diary.empty')}
        </Text>
      ) : (
        items.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityHint={t('diary.editHint')}
            disabled={!onPressItem}
            onPress={() => onPressItem?.(item)}
            testID={`meal-item-${item.id}`}
            className="flex-row items-center justify-between gap-3 rounded-2xl py-1.5 active:opacity-70"
          >
            <View className="flex-1 gap-0.5">
              <Text variant="body" numberOfLines={1}>
                {item.food.name}
              </Text>
              <Text variant="caption" tone="muted">
                {item.grams} {t('common.grams')}
                {item.food.brand ? ` · ${item.food.brand}` : ''}
              </Text>
            </View>
            <Text variant="bodySmall" className="font-inter-semibold">
              {formatKcal(item.nutrients.calories, t, resolvedLanguage)}
            </Text>
          </Pressable>
        ))
      )}
    </Card>
  );
}
