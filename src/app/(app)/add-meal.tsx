import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  AppModal,
  Button,
  Card,
  InDevelopmentNotice,
  Screen,
  ScreenHeader,
  SegmentedControl,
  Text,
  TextField,
} from '@/components/ui';
import { MEAL_TYPES, mealTypeForHour, type MealType } from '@/features/meals/types';

/** Keeps only digits and one decimal separator. */
function sanitizeNumber(value: string): string {
  const normalized = value.replace(',', '.').replace(/[^0-9.]/g, '');
  const [whole = '', ...rest] = normalized.split('.');
  return rest.length > 0 ? `${whole}.${rest.join('')}` : whole;
}

export default function AddMealScreen() {
  const { t } = useTranslation();
  const [mealType, setMealType] = useState<MealType>(() => mealTypeForHour(new Date().getHours()));
  const [form, setForm] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' });
  const [notice, setNotice] = useState(false);

  const update = (key: keyof typeof form) => (value: string) =>
    setForm((current) => ({ ...current, [key]: key === 'name' ? value : sanitizeNumber(value) }));

  return (
    <Screen
      keyboard
      footer={
        <Button
          label={t('addMeal.save')}
          icon="checkmark"
          onPress={() => setNotice(true)}
          disabled={!form.name.trim()}
          testID="add-meal-save"
        />
      }
    >
      <ScreenHeader showBack closeIcon title={t('addMeal.title')} />

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

      <View className="gap-2">
        <TextField
          label={t('addMeal.searchPlaceholder')}
          placeholder={t('addMeal.searchPlaceholder')}
          icon="search-outline"
          editable={false}
          hint={t('addMeal.searchUnavailable')}
        />
      </View>

      <Card className="gap-4">
        <Text variant="subheading">{t('addMeal.manualEntry')}</Text>
        <TextField
          label={t('addMeal.foodName')}
          placeholder={t('addMeal.foodNamePlaceholder')}
          value={form.name}
          onChangeText={update('name')}
          testID="add-meal-name"
        />
        <TextField
          label={t('addMeal.calories')}
          value={form.calories}
          onChangeText={update('calories')}
          keyboardType="decimal-pad"
          placeholder="0"
        />
        <View className="flex-row gap-3">
          {(['protein', 'carbs', 'fat'] as const).map((macro) => (
            <View key={macro} className="flex-1">
              <TextField
                label={t(`addMeal.${macro}`)}
                value={form[macro]}
                onChangeText={update(macro)}
                keyboardType="decimal-pad"
                placeholder="0"
              />
            </View>
          ))}
        </View>
      </Card>

      <InDevelopmentNotice description={t('addMeal.notSavedDescription')} />

      <AppModal
        visible={notice}
        onClose={() => setNotice(false)}
        icon="construct-outline"
        title={t('addMeal.notSavedTitle')}
        description={t('addMeal.notSavedDescription')}
        actions={<Button label={t('common.ok')} onPress={() => setNotice(false)} />}
      />
    </Screen>
  );
}
