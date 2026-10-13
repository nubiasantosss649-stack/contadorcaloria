import { mapOffProduct } from '@/services/food-providers/open-food-facts';
import { mapUsdaFood } from '@/services/food-providers/usda';

describe('USDA FoodData Central mapping', () => {
  it('maps nutrients by nutrient number', () => {
    expect(
      mapUsdaFood({
        fdcId: 1102702,
        description: 'Banana, raw',
        foodNutrients: [
          { nutrientNumber: '208', unitName: 'KCAL', value: 89 },
          { nutrientNumber: '203', unitName: 'G', value: 1.09 },
          { nutrientNumber: '205', unitName: 'G', value: 22.84 },
          { nutrientNumber: '204', unitName: 'G', value: 0.33 },
        ],
      }),
    ).toEqual({
      source: 'usda',
      sourceId: '1102702',
      name: 'Banana, raw',
      brand: null,
      barcode: null,
      caloriesPer100g: 89,
      proteinPer100g: 1.1,
      carbsPer100g: 22.8,
      fatPer100g: 0.3,
    });
  });

  it('keeps missing macros as null and skips foods without energy', () => {
    const food = mapUsdaFood({
      fdcId: 1,
      description: 'Test',
      foodNutrients: [{ nutrientNumber: '208', unitName: 'KCAL', value: 100 }],
    });
    expect(food?.proteinPer100g).toBeNull();
    expect(food?.fatPer100g).toBeNull();
    expect(mapUsdaFood({ fdcId: 2, description: 'No energy', foodNutrients: [] })).toBeNull();
    // kJ values are not mistaken for kcal.
    expect(
      mapUsdaFood({
        fdcId: 3,
        description: 'kJ only',
        foodNutrients: [{ nutrientNumber: '208', unitName: 'kJ', value: 400 }],
      }),
    ).toBeNull();
  });
});

describe('Open Food Facts mapping', () => {
  it('maps a product with full data', () => {
    expect(
      mapOffProduct({
        code: '7891000100103',
        product_name: 'Leite condensado',
        brands: 'Moça, Nestlé',
        nutriments: {
          'energy-kcal_100g': 321,
          proteins_100g: 7.5,
          carbohydrates_100g: 55,
          fat_100g: 7.7,
        },
      }),
    ).toMatchObject({
      source: 'open_food_facts',
      brand: 'Moça',
      barcode: '7891000100103',
      caloriesPer100g: 321,
    });
  });

  it('converts kJ exactly when kcal is absent and never invents macros', () => {
    const food = mapOffProduct({
      code: '12345678',
      product_name: 'Juice',
      nutriments: { 'energy-kj_100g': 184.1 },
    });
    expect(food?.caloriesPer100g).toBe(44);
    expect(food?.proteinPer100g).toBeNull();
    expect(food?.carbsPer100g).toBeNull();
  });

  it('rejects products without name or energy', () => {
    expect(mapOffProduct({ code: '1', nutriments: { 'energy-kcal_100g': 10 } })).toBeNull();
    expect(mapOffProduct({ code: '1', product_name: 'X', nutriments: {} })).toBeNull();
  });
});
