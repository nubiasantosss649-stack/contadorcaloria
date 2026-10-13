import {
  ageFromBirthYear,
  birthYearFromAge,
  estimateDailyCalories,
  macroTargetsFor,
  mifflinStJeorBmr,
  validateManualCalorieTarget,
  type EnergyInputs,
} from '@/lib/energy';

const adult: EnergyInputs = {
  sex: 'female',
  age: 30,
  heightCm: 165,
  weightKg: 65,
  activityLevel: 'moderate',
  goal: 'maintain',
};

describe('Mifflin-St Jeor estimate', () => {
  it('matches the published equation', () => {
    // 10×65 + 6.25×165 − 5×30 − 161 = 1370.25
    expect(mifflinStJeorBmr('female', 65, 165, 30)).toBeCloseTo(1370.25);
    // 10×80 + 6.25×180 − 5×40 + 5 = 1730
    expect(mifflinStJeorBmr('male', 80, 180, 40)).toBe(1730);
  });

  it('applies the activity factor and goal adjustment', () => {
    const maintain = estimateDailyCalories(adult);
    expect(maintain).toMatchObject({ status: 'ok', bmr: 1370, maintenance: 2120, target: 2120 });
    const lose = estimateDailyCalories({ ...adult, goal: 'lose' });
    expect(lose).toMatchObject({ status: 'ok', target: 1620, adjustedForSafety: false });
    const gain = estimateDailyCalories({ ...adult, goal: 'gain' });
    expect(gain).toMatchObject({ status: 'ok', target: 2420 });
  });

  it('never goes below safe floors', () => {
    const small = estimateDailyCalories({
      ...adult,
      weightKg: 45,
      heightCm: 150,
      age: 70,
      activityLevel: 'sedentary',
      goal: 'lose',
    });
    expect(small.status).toBe('ok');
    if (small.status !== 'ok') return;
    expect(small.target).toBeGreaterThanOrEqual(1200);
    expect(small.adjustedForSafety).toBe(true);

    const male = estimateDailyCalories({
      ...adult,
      sex: 'male',
      weightKg: 55,
      heightCm: 160,
      age: 65,
      activityLevel: 'sedentary',
      goal: 'lose',
    });
    if (male.status !== 'ok') throw new Error('expected estimate');
    expect(male.target).toBeGreaterThanOrEqual(1500);
  });

  it('caps the deficit at 25% of maintenance', () => {
    const result = estimateDailyCalories({
      ...adult,
      weightKg: 52,
      heightCm: 158,
      activityLevel: 'sedentary',
      goal: 'lose',
    });
    if (result.status !== 'ok') throw new Error('expected estimate');
    expect(result.target).toBeGreaterThanOrEqual(
      Math.round((result.maintenance * 0.75) / 10) * 10 - 10,
    );
  });

  it('asks for missing data instead of guessing', () => {
    expect(estimateDailyCalories({ ...adult, sex: null, weightKg: null })).toEqual({
      status: 'missing',
      missing: ['sex', 'weightKg'],
    });
  });

  it('does not estimate for minors', () => {
    expect(estimateDailyCalories({ ...adult, age: 16 })).toEqual({ status: 'not_adult' });
  });

  it('derives macro targets that add up to the calories', () => {
    const macros = macroTargetsFor(2000);
    expect(macros).toEqual({ protein: 125, carbs: 225, fat: 67 });
    const kcal = macros.protein * 4 + macros.carbs * 4 + macros.fat * 9;
    expect(Math.abs(kcal - 2000)).toBeLessThan(10);
  });

  it('validates manual targets with a safety floor', () => {
    expect(validateManualCalorieTarget(null)).toBe('goals.errors.required');
    expect(validateManualCalorieTarget(900)).toBe('goals.errors.tooLow');
    expect(validateManualCalorieTarget(1200)).toBeNull();
    expect(validateManualCalorieTarget(12000)).toBe('goals.errors.tooHigh');
  });

  it('converts age and birth year', () => {
    const now = new Date(2026, 5, 1);
    expect(birthYearFromAge(30, now)).toBe(1996);
    expect(ageFromBirthYear(1996, now)).toBe(30);
    expect(ageFromBirthYear(null, now)).toBeNull();
  });
});
