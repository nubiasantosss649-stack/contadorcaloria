import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppModal, Button, NumberField, Text } from '@/components/ui';
import { usePreferences } from '@/features/preferences/preferences-provider';
import { calculateNutrients, isValidPortion, MAX_PORTION_GRAMS } from '@/lib/nutrition';

import type { Food } from '../types';
import { formatGrams, formatKcal } from './nutrient-text';

type PortionModalProps = {
  food: Food | null;
  initialGrams?: number;
  onCancel: () => void;
  onConfirm: (grams: number) => void;
};

/** Asks for the portion in grams and previews the calculated nutrients. */
export function PortionModal(props: PortionModalProps) {
  // Keyed by food so the portion resets whenever another food is opened.
  return props.food ? (
    <PortionModalContent key={props.food.id} {...props} food={props.food} />
  ) : null;
}

function PortionModalContent({
  food,
  initialGrams = 100,
  onCancel,
  onConfirm,
}: PortionModalProps & { food: Food }) {
  const { t } = useTranslation();
  const { resolvedLanguage } = usePreferences();
  const [grams, setGrams] = useState<number | null>(initialGrams);

  const valid = isValidPortion(grams);
  const nutrients = valid
    ? calculateNutrients(
        {
          calories: food.caloriesPer100g,
          protein: food.proteinPer100g,
          carbs: food.carbsPer100g,
          fat: food.fatPer100g,
        },
        grams,
      )
    : null;

  return (
    <AppModal
      visible
      onClose={onCancel}
      title={food.name}
      description={t('addMeal.per100g', {
        kcal: food.caloriesPer100g,
      })}
      actions={
        <>
          <Button
            label={t('addMeal.addPortion')}
            disabled={!valid}
            testID="portion-confirm"
            onPress={() => grams !== null && onConfirm(grams)}
          />
          <Button label={t('common.cancel')} variant="ghost" onPress={onCancel} />
        </>
      }
    >
      <View className="gap-3">
        <NumberField
          label={t('addMeal.portion')}
          value={grams}
          onChangeValue={setGrams}
          error={
            grams !== null && !valid ? t('addMeal.portionError', { max: MAX_PORTION_GRAMS }) : null
          }
          testID="portion-grams"
        />
        {nutrients ? (
          <View
            className="gap-1 rounded-2xl bg-neutral-50 p-3 dark:bg-neutral-800"
            testID="portion-preview"
          >
            <Text variant="subheading">{formatKcal(nutrients.calories, t, resolvedLanguage)}</Text>
            <Text variant="caption" tone="muted">
              {t('macros.protein')} {formatGrams(nutrients.protein, t, resolvedLanguage)} ·{' '}
              {t('macros.carbs')} {formatGrams(nutrients.carbs, t, resolvedLanguage)} ·{' '}
              {t('macros.fat')} {formatGrams(nutrients.fat, t, resolvedLanguage)}
            </Text>
            {nutrients.protein === null || nutrients.carbs === null || nutrients.fat === null ? (
              <Text variant="caption" tone="muted">
                {t('addMeal.unknownValues')}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </AppModal>
  );
}
