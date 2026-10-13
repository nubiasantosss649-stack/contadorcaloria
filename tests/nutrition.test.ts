import {
  calculateNutrients,
  isValidPortion,
  nutrientForQuantity,
  parseDecimal,
  progressRatio,
  remainingCalories,
  round,
  sumNutrients,
  validateFoodPer100g,
} from '@/lib/nutrition';

describe('nutrition calculation', () => {
  it('scales per-100 g values to the portion (spec example: 200 kcal/100 g × 150 g = 300 kcal)', () => {
    expect(nutrientForQuantity(200, 150)).toBe(300);
    expect(nutrientForQuantity(130, 75)).toBe(97.5);
    expect(nutrientForQuantity(52, 118)).toBe(61.4); // 61.36 → 61.4
  });

  it('rounds half away from zero to one decimal, like the database', () => {
    expect(round(1.05, 1)).toBe(1.1);
    expect(round(1.005, 2)).toBe(1.01);
    expect(round(2.25, 1)).toBe(2.3);
    expect(round(-2.25, 1)).toBe(-2.3);
  });

  it('keeps unknown nutrients as null instead of 0', () => {
    expect(calculateNutrients({ calories: 200, protein: 10, carbs: null, fat: null }, 50)).toEqual({
      calories: 100,
      protein: 5,
      carbs: null,
      fat: null,
    });
  });

  it('sums items and flags incomplete macros', () => {
    const totals = sumNutrients([
      { calories: 300, protein: 15, carbs: 30.25, fat: null },
      { calories: 97.5, protein: 2, carbs: 21, fat: 0.4 },
    ]);
    expect(totals.calories).toBe(397.5);
    expect(totals.protein).toBe(17);
    expect(totals.carbs).toBe(51.3);
    expect(totals.fat).toBe(0.4);
    expect(totals.incomplete).toEqual({ protein: false, carbs: false, fat: true });
  });

  it('avoids floating point drift when summing many items', () => {
    const totals = sumNutrients(
      Array.from({ length: 10 }, () => ({ calories: 0.1, protein: 0.1, carbs: 0.1, fat: 0.1 })),
    );
    expect(totals.calories).toBe(1);
    expect(totals.protein).toBe(1);
  });

  it('computes remaining calories and progress', () => {
    expect(remainingCalories(2000, 1500.4)).toBe(500);
    expect(remainingCalories(2000, 2300)).toBe(-300);
    expect(remainingCalories(null, 500)).toBeNull();
    expect(progressRatio(500, 2000)).toBe(0.25);
    expect(progressRatio(3000, 2000)).toBe(1);
    expect(progressRatio(100, null)).toBe(0);
  });

  it('validates portions and food values', () => {
    expect(isValidPortion(150)).toBe(true);
    expect(isValidPortion(0)).toBe(false);
    expect(isValidPortion(5001)).toBe(false);
    expect(isValidPortion(null)).toBe(false);
    const base = { name: 'Oats', calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 };
    expect(validateFoodPer100g(base)).toBeNull();
    expect(validateFoodPer100g({ ...base, name: ' ' })).toBe('foods.errors.nameRequired');
    expect(validateFoodPer100g({ ...base, calories: null })).toBe('foods.errors.caloriesRequired');
    expect(validateFoodPer100g({ ...base, calories: 950 })).toBe('foods.errors.caloriesRange');
    expect(validateFoodPer100g({ ...base, protein: 120 })).toBe('foods.errors.macroRange');
    expect(validateFoodPer100g({ ...base, protein: 60, carbs: 50 })).toBe(
      'foods.errors.macrosExceed',
    );
    expect(validateFoodPer100g({ ...base, protein: null, carbs: null, fat: null })).toBeNull();
  });

  it('parses decimals typed with comma or dot', () => {
    expect(parseDecimal('150')).toBe(150);
    expect(parseDecimal('12,5')).toBe(12.5);
    expect(parseDecimal('12.5')).toBe(12.5);
    expect(parseDecimal('')).toBeNull();
    expect(parseDecimal('abc')).toBeNull();
    expect(parseDecimal('1.2.3')).toBeNull();
  });
});
