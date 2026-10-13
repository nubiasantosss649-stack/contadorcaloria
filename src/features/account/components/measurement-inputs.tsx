import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { NumberField } from '@/components/ui';
import {
  cmToFeetInches,
  feetInchesToCm,
  kgToLb,
  lbToKg,
  roundTo,
  type UnitSystem,
} from '@/lib/units';

type Props<T> = {
  value: T | null;
  onChange: (value: T | null) => void;
  unitSystem: UnitSystem;
  label: string;
  error?: string | null;
  testID?: string;
};

/** Height input that always reports centimetres. */
export function HeightInput({ value, onChange, unitSystem, label, error, testID }: Props<number>) {
  const { t } = useTranslation();
  const initial = value === null ? null : cmToFeetInches(value);
  const [feet, setFeet] = useState<number | null>(initial?.feet ?? null);
  const [inches, setInches] = useState<number | null>(initial?.inches ?? null);

  if (unitSystem === 'metric') {
    return (
      <NumberField
        label={`${label} (${t('units.cm')})`}
        value={value === null ? null : roundTo(value, 0)}
        onChangeValue={onChange}
        integer
        error={error}
        testID={testID}
      />
    );
  }

  const update = (nextFeet: number | null, nextInches: number | null) => {
    setFeet(nextFeet);
    setInches(nextInches);
    onChange(nextFeet === null ? null : roundTo(feetInchesToCm(nextFeet, nextInches ?? 0), 1));
  };

  return (
    <View className="flex-row gap-3">
      <View className="flex-1">
        <NumberField
          label={`${label} (${t('units.ft')})`}
          value={feet}
          onChangeValue={(v) => update(v, inches)}
          integer
          error={error}
          testID={testID}
        />
      </View>
      <View className="flex-1">
        <NumberField
          label={t('units.in')}
          value={inches}
          onChangeValue={(v) => update(feet, v === null ? null : Math.min(11, v))}
          integer
        />
      </View>
    </View>
  );
}

/** Weight input that always reports kilograms. */
export function WeightInput({ value, onChange, unitSystem, label, error, testID }: Props<number>) {
  const { t } = useTranslation();
  const imperial = unitSystem === 'imperial';
  const display = value === null ? null : roundTo(imperial ? kgToLb(value) : value, 1);
  return (
    <NumberField
      label={`${label} (${imperial ? t('units.lb') : t('units.kg')})`}
      value={display}
      onChangeValue={(v) => onChange(v === null ? null : roundTo(imperial ? lbToKg(v) : v, 2))}
      error={error}
      testID={testID}
    />
  );
}
