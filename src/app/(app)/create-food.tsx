import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, Card, NumberField, Screen, ScreenHeader, Text, TextField } from '@/components/ui';
import { useCreateFood } from '@/features/meals/hooks';
import { setPendingFood } from '@/features/meals/pending-food';
import { useErrorMessage } from '@/hooks/use-error-message';
import { validateFoodPer100g } from '@/lib/nutrition';

/** Manual food registration. Values are per 100 g; unknown macros can be left empty. */
export default function CreateFoodScreen() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const params = useLocalSearchParams<{ name?: string }>();
  const createFood = useCreateFood();
  const [name, setName] = useState(params.name ?? '');
  const [brand, setBrand] = useState('');
  const [barcode, setBarcode] = useState('');
  const [calories, setCalories] = useState<number | null>(null);
  const [protein, setProtein] = useState<number | null>(null);
  const [carbs, setCarbs] = useState<number | null>(null);
  const [fat, setFat] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const validationError = validateFoodPer100g({ name, calories, protein, carbs, fat });
  const barcodeError = barcode && !/^\d{6,14}$/.test(barcode) ? t('foods.errors.barcode') : null;

  const submit = () => {
    setSubmitted(true);
    if (validationError || barcodeError || calories === null) return;
    createFood.mutate(
      {
        name,
        brand: brand || null,
        barcode: barcode || null,
        caloriesPer100g: calories,
        proteinPer100g: protein,
        carbsPer100g: carbs,
        fatPer100g: fat,
      },
      {
        onSuccess: (food) => {
          setPendingFood(food);
          router.back();
        },
      },
    );
  };

  return (
    <Screen
      keyboard
      footer={
        <Button
          label={t('foods.save')}
          icon="checkmark"
          loading={createFood.isPending}
          onPress={submit}
          testID="create-food-save"
        />
      }
    >
      <ScreenHeader showBack closeIcon title={t('foods.create')} subtitle={t('foods.subtitle')} />
      <Card className="gap-4">
        <TextField
          label={t('addMeal.foodName')}
          placeholder={t('addMeal.foodNamePlaceholder')}
          value={name}
          onChangeText={setName}
          maxLength={120}
          error={
            submitted && validationError === 'foods.errors.nameRequired' ? t(validationError) : null
          }
          testID="create-food-name"
        />
        <TextField label={t('foods.brand')} value={brand} onChangeText={setBrand} maxLength={120} />
        <TextField
          label={t('foods.barcode')}
          value={barcode}
          onChangeText={(v) => setBarcode(v.replace(/\D/g, ''))}
          keyboardType="number-pad"
          maxLength={14}
          error={submitted ? barcodeError : null}
        />
      </Card>
      <Card className="gap-4">
        <Text variant="subheading">{t('foods.per100g')}</Text>
        <NumberField
          label={t('addMeal.calories')}
          value={calories}
          onChangeValue={setCalories}
          error={
            submitted &&
            (validationError === 'foods.errors.caloriesRequired' ||
              validationError === 'foods.errors.caloriesRange')
              ? t(validationError)
              : null
          }
          testID="create-food-calories"
        />
        <View className="flex-row gap-3">
          {(
            [
              ['addMeal.protein', protein, setProtein, 'create-food-protein'],
              ['addMeal.carbs', carbs, setCarbs, 'create-food-carbs'],
              ['addMeal.fat', fat, setFat, 'create-food-fat'],
            ] as const
          ).map(([label, value, setter, testID]) => (
            <View key={label} className="flex-1">
              <NumberField label={t(label)} value={value} onChangeValue={setter} testID={testID} />
            </View>
          ))}
        </View>
        {submitted &&
        (validationError === 'foods.errors.macroRange' ||
          validationError === 'foods.errors.macrosExceed') ? (
          <Text variant="caption" tone="danger">
            {t(validationError)}
          </Text>
        ) : null}
        <Text variant="caption" tone="muted">
          {t('foods.unknownHint')}
        </Text>
      </Card>
      {createFood.error ? (
        <Text variant="bodySmall" tone="danger" center>
          {errorMessage(createFood.error)}
        </Text>
      ) : null}
    </Screen>
  );
}
