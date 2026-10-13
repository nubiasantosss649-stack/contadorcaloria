import { getLocales } from 'expo-localization';
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import {
  Button,
  ListGroup,
  ListItem,
  NumberField,
  ProgressBar,
  Screen,
  ScreenHeader,
  Text,
  TextField,
} from '@/components/ui';
import { COUNTRIES, isKnownCountry } from '@/constants/countries';
import { HeightInput, WeightInput } from '@/features/account/components/measurement-inputs';
import { GoalPlanner } from '@/features/account/components/goal-planner';
import { useCompleteOnboarding } from '@/features/account/hooks';
import type { GoalsInput, OnboardingAnswers } from '@/features/account/types';
import { usePreferences } from '@/features/preferences/preferences-provider';
import { useErrorMessage } from '@/hooks/use-error-message';
import {
  isValidAge,
  isValidHeightCm,
  isValidWeightKg,
  MAX_AGE,
  MIN_AGE,
  type ActivityLevel,
  type Goal,
  type MissingField,
  type Sex,
} from '@/lib/energy';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n';
import type { UnitSystem } from '@/lib/units';

const STEPS = [
  'goal',
  'age',
  'sex',
  'height',
  'weight',
  'activity',
  'country',
  'language',
  'units',
  'summary',
] as const;
type Step = (typeof STEPS)[number];

const GOALS: readonly Goal[] = ['lose', 'maintain', 'gain'];
const ACTIVITY_LEVELS: readonly ActivityLevel[] = [
  'sedentary',
  'light',
  'moderate',
  'active',
  'very_active',
];
const FIELD_STEP: Record<MissingField, Step> = {
  goal: 'goal',
  age: 'age',
  sex: 'sex',
  heightCm: 'height',
  weightKg: 'weight',
  activityLevel: 'activity',
};

function deviceCountry(): string | null {
  try {
    const region = getLocales()[0]?.regionCode ?? null;
    return isKnownCountry(region) ? region : null;
  } catch {
    return null;
  }
}

/** Post-sign-up questionnaire. Every question except the final step can be skipped. */
export default function SetupScreen() {
  const { t } = useTranslation();
  const errorMessage = useErrorMessage();
  const preferences = usePreferences();
  const complete = useCompleteOnboarding();
  const [stepIndex, setStepIndex] = useState(0);
  const [countryQuery, setCountryQuery] = useState('');
  const [answers, setAnswers] = useState<OnboardingAnswers>(() => ({
    goal: null,
    age: null,
    sex: null,
    heightCm: null,
    weightKg: null,
    activityLevel: null,
    country: deviceCountry(),
    language: preferences.resolvedLanguage,
    unitSystem: preferences.unitSystem,
  }));
  const step = STEPS[stepIndex] ?? 'summary';

  const set = <K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K]) =>
    setAnswers((current) => ({ ...current, [key]: value }));

  const goTo = (target: Step) => setStepIndex(STEPS.indexOf(target));
  const next = () => setStepIndex((i) => Math.min(STEPS.length - 1, i + 1));
  const back = () => setStepIndex((i) => Math.max(0, i - 1));

  // A typed but invalid value blocks "Continue" (the user can still skip, which clears it).
  const invalid =
    (step === 'age' && answers.age !== null && !isValidAge(answers.age)) ||
    (step === 'height' && answers.heightCm !== null && !isValidHeightCm(answers.heightCm)) ||
    (step === 'weight' && answers.weightKg !== null && !isValidWeightKg(answers.weightKg));

  const skip = () => {
    const field: Partial<Record<Step, keyof OnboardingAnswers>> = {
      goal: 'goal',
      age: 'age',
      sex: 'sex',
      height: 'heightCm',
      weight: 'weightKg',
      activity: 'activityLevel',
      country: 'country',
    };
    const key = field[step];
    if (key) set(key, null as never);
    next();
  };

  const finish = (goals: GoalsInput | null) => {
    complete.mutate(
      { answers, goals },
      {
        onSuccess: () => {
          preferences.setPreference('language', answers.language);
          preferences.setPreference('unitSystem', answers.unitSystem);
        },
      },
    );
  };

  const energyInputs = useMemo(
    () => ({
      sex: answers.sex,
      age: answers.age,
      heightCm: answers.heightCm,
      weightKg: answers.weightKg,
      activityLevel: answers.activityLevel,
      goal: answers.goal,
    }),
    [answers],
  );

  const filteredCountries = COUNTRIES.filter((country) =>
    country.names[preferences.resolvedLanguage]
      .toLowerCase()
      .includes(countryQuery.trim().toLowerCase()),
  );

  const isSkippable = !['language', 'units', 'summary'].includes(step);

  return (
    <Screen
      keyboard
      footer={
        step === 'summary' ? null : (
          <View className="gap-2">
            <Button
              label={t('common.continue')}
              onPress={next}
              disabled={invalid}
              testID="setup-continue"
            />
            {isSkippable ? (
              <Button
                label={t('setup.skip')}
                variant="ghost"
                size="md"
                onPress={skip}
                testID="setup-skip"
              />
            ) : null}
          </View>
        )
      }
    >
      <View className="gap-3 pt-2">
        <View className="flex-row items-center justify-between">
          <Text variant="caption" tone="muted">
            {t('setup.progress', { current: stepIndex + 1, total: STEPS.length })}
          </Text>
          {stepIndex > 0 ? (
            <Button
              label={t('common.back')}
              variant="ghost"
              size="sm"
              fullWidth={false}
              onPress={back}
            />
          ) : null}
        </View>
        <ProgressBar
          progress={(stepIndex + 1) / STEPS.length}
          accessibilityLabel={t('setup.title')}
        />
      </View>

      <ScreenHeader
        title={t(`setup.steps.${step}.title`)}
        subtitle={t(`setup.steps.${step}.subtitle`)}
      />

      {step === 'goal' ? (
        <ListGroup>
          {GOALS.map((goal) => (
            <ListItem
              key={goal}
              title={t(`setup.goals.${goal}`)}
              selected={answers.goal === goal}
              onPress={() => set('goal', goal)}
              testID={`setup-goal-${goal}`}
            />
          ))}
        </ListGroup>
      ) : null}

      {step === 'age' ? (
        <NumberField
          label={t('setup.fields.age')}
          value={answers.age}
          onChangeValue={(v) => set('age', v)}
          integer
          error={invalid ? t('setup.errors.age', { min: MIN_AGE, max: MAX_AGE }) : null}
          testID="setup-age"
        />
      ) : null}

      {step === 'sex' ? (
        <ListGroup>
          {(['female', 'male'] as const satisfies readonly Sex[]).map((sex) => (
            <ListItem
              key={sex}
              title={t(`setup.sex.${sex}`)}
              selected={answers.sex === sex}
              onPress={() => set('sex', sex)}
              testID={`setup-sex-${sex}`}
            />
          ))}
        </ListGroup>
      ) : null}

      {step === 'height' ? (
        <HeightInput
          label={t('setup.fields.height')}
          value={answers.heightCm}
          onChange={(v) => set('heightCm', v)}
          unitSystem={answers.unitSystem}
          error={invalid ? t('setup.errors.height') : null}
          testID="setup-height"
        />
      ) : null}

      {step === 'weight' ? (
        <WeightInput
          label={t('setup.fields.weight')}
          value={answers.weightKg}
          onChange={(v) => set('weightKg', v)}
          unitSystem={answers.unitSystem}
          error={invalid ? t('setup.errors.weight') : null}
          testID="setup-weight"
        />
      ) : null}

      {step === 'height' || step === 'weight' ? (
        <Button
          label={answers.unitSystem === 'metric' ? t('setup.useImperial') : t('setup.useMetric')}
          variant="ghost"
          size="sm"
          onPress={() => set('unitSystem', answers.unitSystem === 'metric' ? 'imperial' : 'metric')}
        />
      ) : null}

      {step === 'activity' ? (
        <ListGroup>
          {ACTIVITY_LEVELS.map((level) => (
            <ListItem
              key={level}
              title={t(`setup.activity.${level}.title`)}
              subtitle={t(`setup.activity.${level}.description`)}
              selected={answers.activityLevel === level}
              onPress={() => set('activityLevel', level)}
              testID={`setup-activity-${level}`}
            />
          ))}
        </ListGroup>
      ) : null}

      {step === 'country' ? (
        <View className="gap-3">
          <TextField
            label={t('setup.fields.countrySearch')}
            icon="search-outline"
            value={countryQuery}
            onChangeText={setCountryQuery}
          />
          <ListGroup>
            {filteredCountries.map((country) => (
              <ListItem
                key={country.code}
                title={country.names[preferences.resolvedLanguage]}
                value={country.code}
                selected={answers.country === country.code}
                onPress={() => set('country', country.code)}
              />
            ))}
          </ListGroup>
        </View>
      ) : null}

      {step === 'language' ? (
        <ListGroup>
          {SUPPORTED_LANGUAGES.map((code) => (
            <ListItem
              key={code}
              title={t(`language.names.${code}`)}
              selected={answers.language === code}
              onPress={() => {
                set('language', code);
                // Preview the language immediately.
                preferences.setPreference('language', code);
              }}
              testID={`setup-language-${code}`}
            />
          ))}
        </ListGroup>
      ) : null}

      {step === 'units' ? (
        <ListGroup>
          {(['metric', 'imperial'] as const satisfies readonly UnitSystem[]).map((system) => (
            <ListItem
              key={system}
              title={t(`settings.${system}`)}
              selected={answers.unitSystem === system}
              onPress={() => set('unitSystem', system)}
              testID={`setup-units-${system}`}
            />
          ))}
        </ListGroup>
      ) : null}

      {step === 'summary' ? (
        <View className="gap-4">
          <GoalPlanner
            inputs={energyInputs}
            saving={complete.isPending}
            submitLabel={t('setup.finish')}
            onSubmit={finish}
            onFixMissing={(field) => goTo(FIELD_STEP[field])}
          />
          <Button
            label={t('setup.finishWithoutGoal')}
            variant="ghost"
            size="md"
            disabled={complete.isPending}
            onPress={() => finish(null)}
            testID="setup-finish-without-goal"
          />
          {complete.error ? (
            <Text variant="bodySmall" tone="danger" center accessibilityLiveRegion="polite">
              {errorMessage(complete.error)}
            </Text>
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}
