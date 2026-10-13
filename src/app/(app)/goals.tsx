import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  Button,
  Card,
  ListGroup,
  ListItem,
  LoadingView,
  NumberField,
  Screen,
  ScreenHeader,
  Text,
} from '@/components/ui';
import { GoalPlanner } from '@/features/account/components/goal-planner';
import { HeightInput, WeightInput } from '@/features/account/components/measurement-inputs';
import { useAccount, useLogWeight, useSaveGoals, useSaveHealth } from '@/features/account/hooks';
import { usePreferences } from '@/features/preferences/preferences-provider';
import { useErrorMessage } from '@/hooks/use-error-message';
import {
  ageFromBirthYear,
  birthYearFromAge,
  isValidAge,
  isValidHeightCm,
  isValidWeightKg,
  type ActivityLevel,
  type Goal,
  type Sex,
} from '@/lib/energy';

/** Review body data and recalculate (or manually set) the daily targets. */
export default function GoalsScreen() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const { unitSystem } = usePreferences();
  const account = useAccount();
  const saveGoals = useSaveGoals();
  const saveHealth = useSaveHealth();
  const logWeight = useLogWeight();

  const health = account.data?.health;
  const [goal, setGoal] = useState<Goal | null>(health?.goal ?? null);
  const [sex, setSex] = useState<Sex | null>(health?.sex ?? null);
  const [age, setAge] = useState<number | null>(ageFromBirthYear(health?.birthYear ?? null));
  const [heightCm, setHeightCm] = useState<number | null>(health?.heightCm ?? null);
  const [weightKg, setWeightKg] = useState<number | null>(
    account.data?.latestWeight?.weightKg ?? null,
  );
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(
    health?.activityLevel ?? null,
  );

  const inputs = useMemo(
    () => ({
      goal,
      sex,
      age: isValidAge(age) ? age : null,
      heightCm: isValidHeightCm(heightCm) ? heightCm : null,
      weightKg: isValidWeightKg(weightKg) ? weightKg : null,
      activityLevel,
    }),
    [goal, sex, age, heightCm, weightKg, activityLevel],
  );

  if (account.isPending) return <LoadingView />;

  const error = saveGoals.error ?? saveHealth.error ?? logWeight.error;

  return (
    <Screen keyboard>
      <ScreenHeader showBack title={t('goals.title')} subtitle={t('goals.subtitle')} />

      <Card className="gap-4">
        <Text variant="subheading">{t('goals.bodyData')}</Text>
        <View className="gap-2">
          <Text variant="caption" tone="muted">
            {t('goals.fields.goal')}
          </Text>
          <ListGroup>
            {(['lose', 'maintain', 'gain'] as const).map((g) => (
              <ListItem
                key={g}
                title={t(`setup.goals.${g}`)}
                selected={goal === g}
                onPress={() => setGoal(g)}
              />
            ))}
          </ListGroup>
        </View>
        <View className="gap-2">
          <Text variant="caption" tone="muted">
            {t('goals.fields.sex')}
          </Text>
          <ListGroup>
            {(['female', 'male'] as const).map((s) => (
              <ListItem
                key={s}
                title={t(`setup.sex.${s}`)}
                selected={sex === s}
                onPress={() => setSex(s)}
              />
            ))}
          </ListGroup>
        </View>
        <NumberField
          label={t('setup.fields.age')}
          value={age}
          onChangeValue={setAge}
          integer
          error={
            age !== null && !isValidAge(age) ? t('setup.errors.age', { min: 13, max: 120 }) : null
          }
        />
        <HeightInput
          label={t('setup.fields.height')}
          value={heightCm}
          onChange={setHeightCm}
          unitSystem={unitSystem}
          error={heightCm !== null && !isValidHeightCm(heightCm) ? t('setup.errors.height') : null}
        />
        <WeightInput
          label={t('setup.fields.weight')}
          value={weightKg}
          onChange={setWeightKg}
          unitSystem={unitSystem}
          error={weightKg !== null && !isValidWeightKg(weightKg) ? t('setup.errors.weight') : null}
        />
        <View className="gap-2">
          <Text variant="caption" tone="muted">
            {t('goals.fields.activityLevel')}
          </Text>
          <ListGroup>
            {(['sedentary', 'light', 'moderate', 'active', 'very_active'] as const).map((level) => (
              <ListItem
                key={level}
                title={t(`setup.activity.${level}.title`)}
                selected={activityLevel === level}
                onPress={() => setActivityLevel(level)}
              />
            ))}
          </ListGroup>
        </View>
      </Card>

      <GoalPlanner
        key={JSON.stringify(inputs)}
        inputs={inputs}
        currentTarget={account.data?.goals?.dailyCalorieTarget ?? null}
        saving={saveGoals.isPending || saveHealth.isPending}
        submitLabel={t('goals.save')}
        onSubmit={async (goals) => {
          try {
            await saveHealth.mutateAsync({
              goal,
              sex,
              birthYear: isValidAge(age) ? birthYearFromAge(age) : null,
              heightCm: inputs.heightCm,
              activityLevel,
            });
            const previous = account.data?.latestWeight?.weightKg ?? null;
            if (inputs.weightKg !== null && inputs.weightKg !== previous) {
              await logWeight.mutateAsync(inputs.weightKg);
            }
            await saveGoals.mutateAsync(goals);
            router.back();
          } catch {
            // Shown below through the mutation error state.
          }
        }}
      />

      {error ? (
        <Text variant="bodySmall" tone="danger" center>
          {errorMessage(error)}
        </Text>
      ) : null}
      <Button label={t('common.cancel')} variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}
