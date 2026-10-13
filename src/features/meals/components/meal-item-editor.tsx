import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppModal, Button, NumberField, Text } from '@/components/ui';
import { usePreferences } from '@/features/preferences/preferences-provider';
import { useErrorMessage } from '@/hooks/use-error-message';
import { calculateNutrients, isValidPortion, MAX_PORTION_GRAMS } from '@/lib/nutrition';

import { useDeleteMealItem, useUpdateMealItem } from '../hooks';
import type { MealItem } from '../types';
import { formatGrams, formatKcal } from './nutrient-text';

/** Edit the grams of a logged item, or delete it. */
export function MealItemEditor({ item, onClose }: { item: MealItem | null; onClose: () => void }) {
  // Keyed by item so local state starts fresh for every item.
  return item ? <MealItemEditorContent key={item.id} item={item} onClose={onClose} /> : null;
}

function MealItemEditorContent({ item, onClose }: { item: MealItem; onClose: () => void }) {
  const { t } = useTranslation();
  const { resolvedLanguage } = usePreferences();
  const errorMessage = useErrorMessage();
  const update = useUpdateMealItem();
  const remove = useDeleteMealItem();
  const [grams, setGrams] = useState<number | null>(item.grams);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const valid = isValidPortion(grams);
  const preview = valid
    ? calculateNutrients(
        {
          calories: item.food.caloriesPer100g,
          protein: item.food.proteinPer100g,
          carbs: item.food.carbsPer100g,
          fat: item.food.fatPer100g,
        },
        grams,
      )
    : null;
  const error = update.error ?? remove.error;

  return (
    <AppModal
      visible
      onClose={onClose}
      title={item.food.name}
      description={item.food.brand ?? undefined}
      actions={
        confirmDelete ? (
          <>
            <Text variant="bodySmall" tone="muted" center>
              {t('diary.deleteConfirm')}
            </Text>
            <Button
              label={t('diary.delete')}
              variant="danger"
              loading={remove.isPending}
              testID="meal-item-confirm-delete"
              onPress={() =>
                remove.mutate({ itemId: item.id, entryId: item.entryId }, { onSuccess: onClose })
              }
            />
            <Button
              label={t('common.cancel')}
              variant="ghost"
              onPress={() => setConfirmDelete(false)}
            />
          </>
        ) : (
          <>
            <Button
              label={t('common.save')}
              disabled={!valid}
              loading={update.isPending}
              testID="meal-item-save"
              onPress={() =>
                grams !== null && update.mutate({ itemId: item.id, grams }, { onSuccess: onClose })
              }
            />
            <Button
              label={t('diary.delete')}
              variant="ghost"
              testID="meal-item-delete"
              onPress={() => setConfirmDelete(true)}
            />
          </>
        )
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
          testID="meal-item-grams"
        />
        {preview ? (
          <Text variant="bodySmall" tone="muted" testID="meal-item-preview">
            {formatKcal(preview.calories, t, resolvedLanguage)} · {t('macros.protein')}{' '}
            {formatGrams(preview.protein, t, resolvedLanguage)} · {t('macros.carbs')}{' '}
            {formatGrams(preview.carbs, t, resolvedLanguage)} · {t('macros.fat')}{' '}
            {formatGrams(preview.fat, t, resolvedLanguage)}
          </Text>
        ) : null}
        {error ? (
          <Text variant="bodySmall" tone="danger">
            {errorMessage(error)}
          </Text>
        ) : null}
      </View>
    </AppModal>
  );
}
