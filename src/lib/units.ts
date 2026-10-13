/**
 * Unit conversion helpers. Values are always stored in metric (kg, cm, kcal)
 * and only converted for display / input according to the user's unit system.
 */
export type UnitSystem = 'metric' | 'imperial';

export const KG_PER_LB = 0.45359237;
export const CM_PER_INCH = 2.54;
export const INCHES_PER_FOOT = 12;
export const KJ_PER_KCAL = 4.184;

export function kgToLb(kg: number): number {
  return kg / KG_PER_LB;
}

export function lbToKg(lb: number): number {
  return lb * KG_PER_LB;
}

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = Math.round(cm / CM_PER_INCH);
  return { feet: Math.floor(totalInches / INCHES_PER_FOOT), inches: totalInches % INCHES_PER_FOOT };
}

export function feetInchesToCm(feet: number, inches: number): number {
  return (feet * INCHES_PER_FOOT + inches) * CM_PER_INCH;
}

export function kcalToKj(kcal: number): number {
  return kcal * KJ_PER_KCAL;
}

/** Default unit system for a region (US, Liberia and Myanmar use imperial). */
export function defaultUnitSystemForRegion(regionCode: string | null | undefined): UnitSystem {
  return regionCode && ['US', 'LR', 'MM'].includes(regionCode.toUpperCase())
    ? 'imperial'
    : 'metric';
}

export function roundTo(value: number, decimals = 1): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function formatNumber(value: number, locale: string, maximumFractionDigits = 0): string {
  try {
    return new Intl.NumberFormat(locale, { maximumFractionDigits }).format(value);
  } catch {
    return roundTo(value, maximumFractionDigits).toString();
  }
}

/** Displays a weight stored in kg, e.g. "154 lb" or "70 kg". */
export function formatWeight(kg: number, system: UnitSystem, locale: string): string {
  return system === 'imperial'
    ? `${formatNumber(kgToLb(kg), locale, 1)} lb`
    : `${formatNumber(kg, locale, 1)} kg`;
}

/** Displays a height stored in cm, e.g. `5' 9"` or "175 cm". */
export function formatHeight(cm: number, system: UnitSystem, locale: string): string {
  if (system === 'imperial') {
    const { feet, inches } = cmToFeetInches(cm);
    return `${feet}' ${inches}"`;
  }
  return `${formatNumber(cm, locale)} cm`;
}
