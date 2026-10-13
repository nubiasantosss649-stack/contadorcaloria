import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Badge, Icon, Text } from '@/components/ui';
import { useAppTheme } from '@/hooks/use-app-theme';

import type { Food } from '../types';

export function FoodRow({ food, onPress }: { food: Food; onPress: () => void }) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={food.name}
      onPress={onPress}
      testID={`food-${food.id}`}
      className="flex-row items-center gap-3 px-4 py-3 active:bg-neutral-50 dark:active:bg-neutral-800"
    >
      <View className="flex-1 gap-0.5">
        <Text variant="body" numberOfLines={1} className="font-inter-medium">
          {food.name}
        </Text>
        <View className="flex-row items-center gap-2">
          <Text variant="caption" tone="muted">
            {t('addMeal.per100g', { kcal: food.caloriesPer100g })}
            {food.brand ? ` · ${food.brand}` : ''}
          </Text>
          {food.isOwn ? <Badge label={t('foods.mine')} tone="neutral" /> : null}
        </View>
      </View>
      <Icon name="add-circle-outline" size={22} color={colors.primary} />
    </Pressable>
  );
}
