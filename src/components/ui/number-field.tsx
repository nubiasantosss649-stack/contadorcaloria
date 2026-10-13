import { useState } from 'react';

import { parseDecimal } from '@/lib/nutrition';

import { TextField, type TextFieldProps } from './text-field';

export type NumberFieldProps = Omit<TextFieldProps, 'value' | 'onChangeText' | 'keyboardType'> & {
  value: number | null;
  onChangeValue: (value: number | null) => void;
  /** Whole numbers only (e.g. age, kcal). */
  integer?: boolean;
};

/** Numeric input that accepts "," or "." and reports `null` for empty/invalid text. */
export function NumberField({ value, onChangeValue, integer = false, ...props }: NumberFieldProps) {
  const [text, setText] = useState(value === null ? '' : String(value));

  const [lastValue, setLastValue] = useState(value);
  // Keep the text in sync when the value changes from outside (e.g. unit conversion).
  // Adjusting state during render is React's recommended alternative to an effect here.
  if (value !== lastValue) {
    setLastValue(value);
    if (parseDecimal(text) !== value) setText(value === null ? '' : String(value));
  }

  return (
    <TextField
      {...props}
      value={text}
      keyboardType={integer ? 'number-pad' : 'decimal-pad'}
      inputMode={integer ? 'numeric' : 'decimal'}
      onChangeText={(raw) => {
        const cleaned = integer ? raw.replace(/\D/g, '') : raw.replace(/[^0-9.,]/g, '');
        setText(cleaned);
        const parsed = parseDecimal(cleaned);
        const next = parsed === null ? null : integer ? Math.trunc(parsed) : parsed;
        setLastValue(next);
        onChangeValue(next);
      }}
    />
  );
}
