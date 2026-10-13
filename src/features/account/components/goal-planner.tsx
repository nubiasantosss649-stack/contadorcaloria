import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button, Card, Icon, NumberField, SegmentedControl, Text } from '@/components/ui';
import { palette } from '@/constants/palette';
import { useAppTheme } from '@/hooks/use-app-theme';
import {
  ABSOLUTE_MIN_CALORIES,
  estimateDailyCalories,
  macroTargetsFor,
  validateManualCalorieTarget,
  type EnergyInputs,
  type MissingField,
} from '@/lib/energy';

import type { GoalsInput } from '../types';

export type GoalPlannerProps = {
  inputs: EnergyInputs;
  /** Pre-fills manual mode with the current target, if any. */
  currentTarget?: number | null;
  saving?: boolean;
  submitLabel: string;
  onSubmit: (goals: GoalsInput) => void;
  onFixMissing?: (field: MissingField) => void;
};

function Disclaimer() {
  const { t } = useTranslation();
  return (
    <View
      className="flex-row gap-2 rounded-2xl bg-neutral-100 p-3 dark:bg-neutral-800"
      testID="goal-disclaimer"
    >
      <Icon name="medkit-outline" size={18} color={palette.neutral[500]} />
      <Text variant="caption" tone="muted" className="flex-1">
        {t('goals.disclaimer')}
      </Text>
    </View>
  );
}

/**
 * Shows the Mifflin-St Jeor estimate when there is enough data, explains what is missing
 * otherwise, and always allows a manual target (with a safety floor).
 */
export function GoalPlanner({
  inputs,
  currentTarget,
  saving,
  submitLabel,
  onSubmit,
  onFixMissing,
}: GoalPlannerProps) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const estimate = useMemo(() => estimateDailyCalories(inputs), [inputs]);
  const [mode, setMode] = useState<'estimate' | 'manual'>(currentTarget ? 'manual' : 'estimate');
  const [manual, setManual] = useState<number | null>(currentTarget ?? null);
  const [submitted, setSubmitted] = useState(false);
  const manualError = validateManualCalorieTarget(manual);

  const submitManual = () => {
    setSubmitted(true);
    if (manualError || manual === null) return;
    const macros = macroTargetsFor(manual);
    onSubmit({
      dailyCalorieTarget: Math.round(manual),
      proteinTarget: macros.protein,
      carbTarget: macros.carbs,
      fatTarget: macros.fat,
      source: 'manual',
    });
  };

  return (
    <View className="gap-4">
      <SegmentedControl<'estimate' | 'manual'>
        accessibilityLabel={t('goals.title')}
        value={mode}
        onChange={setMode}
        options={[
          { value: 'estimate', label: t('goals.useEstimate') },
          { value: 'manual', label: t('goals.setManually') },
        ]}
      />

      {mode === 'estimate' ? (
        estimate.status === 'ok' ? (
          <Card className="gap-4" testID="goal-estimate">
            <View className="items-center gap-1">
              <Text variant="caption" tone="muted">
                {t('goals.estimatedTarget')}
              </Text>
              <Text variant="display" tone="primary">
                {estimate.target}
              </Text>
              <Text variant="bodySmall" tone="muted">
                {t('common.kcal')} / {t('goals.perDay')}
              </Text>
            </View>
            <View className="flex-row justify-between">
              {(
                [
                  ['macros.protein', estimate.macros.protein],
                  ['macros.carbs', estimate.macros.carbs],
                  ['macros.fat', estimate.macros.fat],
                ] as const
              ).map(([key, grams]) => (
                <View key={key} className="flex-1 items-center gap-0.5">
                  <Text variant="subheading">
                    {grams} {t('common.grams')}
                  </Text>
                  <Text variant="caption" tone="muted">
                    {t(key)}
                  </Text>
                </View>
              ))}
            </View>
            <Text variant="caption" tone="muted" center>
              {t('goals.methodology', { maintenance: estimate.maintenance })}
            </Text>
            {estimate.adjustedForSafety ? (
              <View className="flex-row gap-2 rounded-2xl bg-warning-50 p-3 dark:bg-neutral-800">
                <Icon name="shield-checkmark-outline" size={18} color={palette.warning[500]} />
                <Text variant="caption" tone="warning" className="flex-1">
                  {t('goals.safetyAdjusted')}
                </Text>
              </View>
            ) : null}
            <Button
              label={submitLabel}
              loading={saving}
              testID="goal-use-estimate"
              onPress={() =>
                onSubmit({
                  dailyCalorieTarget: estimate.target,
                  proteinTarget: estimate.macros.protein,
                  carbTarget: estimate.macros.carbs,
                  fatTarget: estimate.macros.fat,
                  source: 'estimate',
                })
              }
            />
          </Card>
        ) : estimate.status === 'not_adult' ? (
          <Card className="gap-2" testID="goal-not-adult">
            <Text variant="subheading">{t('goals.notAdultTitle')}</Text>
            <Text variant="bodySmall" tone="muted">
              {t('goals.notAdultDescription')}
            </Text>
          </Card>
        ) : (
          <Card className="gap-3" testID="goal-missing">
            <Text variant="subheading">{t('goals.missingTitle')}</Text>
            <Text variant="bodySmall" tone="muted">
              {t('goals.missingDescription')}
            </Text>
            {estimate.missing.map((field) => (
              <View key={field} className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Icon name="alert-circle-outline" size={18} color={colors.textMuted} />
                  <Text variant="body">{t(`goals.fields.${field}`)}</Text>
                </View>
                {onFixMissing ? (
                  <Button
                    label={t('goals.answer')}
                    variant="secondary"
                    size="sm"
                    fullWidth={false}
                    onPress={() => onFixMissing(field)}
                  />
                ) : null}
              </View>
            ))}
          </Card>
        )
      ) : (
        <Card className="gap-4">
          <NumberField
            label={t('goals.manualLabel')}
            value={manual}
            onChangeValue={setManual}
            integer
            hint={t('goals.manualHint', { min: ABSOLUTE_MIN_CALORIES })}
            error={submitted && manualError ? t(manualError, { min: ABSOLUTE_MIN_CALORIES }) : null}
            testID="goal-manual-input"
          />
          {manual !== null && !manualError ? (
            <Text variant="caption" tone="muted">
              {t('goals.manualMacros', macroTargetsFor(manual))}
            </Text>
          ) : null}
          <Button
            label={submitLabel}
            loading={saving}
            onPress={submitManual}
            testID="goal-save-manual"
          />
        </Card>
      )}

      <Disclaimer />
    </View>
  );
}
