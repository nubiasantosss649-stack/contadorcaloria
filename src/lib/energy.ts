/**
 * Daily energy estimate using the Mifflin-St Jeor equation (Mifflin et al., 1990), the
 * method recommended by the Academy of Nutrition and Dietetics for healthy adults, multiplied
 * by a standard physical-activity factor.
 *
 * These are ESTIMATES for healthy adults, not medical prescriptions. Targets are never
 * lowered below conservative floors to avoid dangerously restrictive goals.
 */
export type Sex = 'female' | 'male';
export type Goal = 'lose' | 'maintain' | 'gain';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

/** Daily adjustment vs. maintenance (≈0.5 kg/week loss, modest surplus for gain). */
export const GOAL_ADJUSTMENT_KCAL: Record<Goal, number> = { lose: -500, maintain: 0, gain: 300 };

/** Commonly cited minimum intakes without medical supervision. */
export const MIN_CALORIES_BY_SEX: Record<Sex, number> = { female: 1200, male: 1500 };
/** Absolute floor for any target, including manual ones (mirrors the DB constraint). */
export const ABSOLUTE_MIN_CALORIES = 1200;
export const MAX_CALORIES = 10000;
/** Never cut more than 25% below maintenance. */
export const MAX_DEFICIT_RATIO = 0.25;

export const ADULT_MIN_AGE = 18;
export const MIN_AGE = 13;
export const MAX_AGE = 120;

export type EnergyInputs = {
  sex: Sex | null;
  age: number | null;
  heightCm: number | null;
  weightKg: number | null;
  activityLevel: ActivityLevel | null;
  goal: Goal | null;
};

export type MissingField = 'sex' | 'age' | 'heightCm' | 'weightKg' | 'activityLevel' | 'goal';

export type MacroTargets = { protein: number; carbs: number; fat: number };

export type EnergyEstimate =
  | {
      status: 'ok';
      bmr: number;
      maintenance: number;
      target: number;
      /** True when the target was raised to a safety floor. */
      adjustedForSafety: boolean;
      macros: MacroTargets;
    }
  | { status: 'missing'; missing: MissingField[] }
  | { status: 'not_adult' };

export function mifflinStJeorBmr(
  sex: Sex,
  weightKg: number,
  heightCm: number,
  age: number,
): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? base + 5 : base - 161;
}

/**
 * Macro split within the Acceptable Macronutrient Distribution Ranges:
 * protein 25% (4 kcal/g), carbs 45% (4 kcal/g), fat 30% (9 kcal/g).
 */
export function macroTargetsFor(calories: number): MacroTargets {
  return {
    protein: Math.round((calories * 0.25) / 4),
    carbs: Math.round((calories * 0.45) / 4),
    fat: Math.round((calories * 0.3) / 9),
  };
}

/** Rounds to the nearest 10 kcal, which is the precision these equations justify. */
function roundTo10(value: number): number {
  return Math.round(value / 10) * 10;
}

export function estimateDailyCalories(inputs: EnergyInputs): EnergyEstimate {
  const missing = (['sex', 'age', 'heightCm', 'weightKg', 'activityLevel', 'goal'] as const).filter(
    (key) => inputs[key] === null,
  );
  if (missing.length > 0) return { status: 'missing', missing };

  const { sex, age, heightCm, weightKg, activityLevel, goal } = inputs as {
    [K in keyof EnergyInputs]: NonNullable<EnergyInputs[K]>;
  };
  if (age < ADULT_MIN_AGE) return { status: 'not_adult' };

  const bmr = mifflinStJeorBmr(sex, weightKg, heightCm, age);
  const maintenance = bmr * ACTIVITY_FACTORS[activityLevel];
  const raw = maintenance + GOAL_ADJUSTMENT_KCAL[goal];
  const floor = Math.max(
    MIN_CALORIES_BY_SEX[sex],
    goal === 'lose' ? maintenance * (1 - MAX_DEFICIT_RATIO) : 0,
  );
  const target = roundTo10(Math.min(MAX_CALORIES, Math.max(raw, floor)));

  return {
    status: 'ok',
    bmr: Math.round(bmr),
    maintenance: roundTo10(maintenance),
    target,
    adjustedForSafety: raw < floor,
    macros: macroTargetsFor(target),
  };
}

export type ManualTargetError =
  'goals.errors.required' | 'goals.errors.tooLow' | 'goals.errors.tooHigh';

export function validateManualCalorieTarget(value: number | null): ManualTargetError | null {
  if (value === null || !Number.isFinite(value)) return 'goals.errors.required';
  if (value < ABSOLUTE_MIN_CALORIES) return 'goals.errors.tooLow';
  if (value > MAX_CALORIES) return 'goals.errors.tooHigh';
  return null;
}

export function ageFromBirthYear(birthYear: number | null, now: Date = new Date()): number | null {
  return birthYear === null ? null : now.getFullYear() - birthYear;
}

/** Only the age is asked, so the birth year is approximate (± 1 year). */
export function birthYearFromAge(age: number, now: Date = new Date()): number {
  return now.getFullYear() - age;
}

export function isValidAge(age: number | null): age is number {
  return age !== null && Number.isInteger(age) && age >= MIN_AGE && age <= MAX_AGE;
}

export function isValidHeightCm(cm: number | null): cm is number {
  return cm !== null && cm >= 50 && cm <= 272;
}

export function isValidWeightKg(kg: number | null): kg is number {
  return kg !== null && kg >= 20 && kg <= 500;
}
