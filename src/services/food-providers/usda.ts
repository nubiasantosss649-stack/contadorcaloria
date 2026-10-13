import { cleanNumber, cleanText, type ExternalFood, type FoodProvider } from './types';

/**
 * USDA FoodData Central — https://fdc.nal.usda.gov/api-guide
 * Search results report nutrients per 100 g for Foundation, SR Legacy and Branded foods.
 */
type UsdaNutrient = {
  nutrientNumber?: string;
  nutrientName?: string;
  unitName?: string;
  value?: number;
};
export type UsdaFood = {
  fdcId?: number;
  description?: string;
  brandOwner?: string;
  brandName?: string;
  gtinUpc?: string;
  dataType?: string;
  foodNutrients?: UsdaNutrient[];
};

// Energy (kcal): 208; Atwater general/specific factors (Foundation foods): 957 / 958.
const ENERGY_NUMBERS = ['208', '957', '958'];

function nutrient(food: UsdaFood, numbers: string[], unit: string): number | undefined {
  for (const number of numbers) {
    const match = food.foodNutrients?.find(
      (n) => n.nutrientNumber === number && n.unitName?.toUpperCase() === unit,
    );
    if (match?.value !== undefined) return match.value;
  }
  return undefined;
}

export function mapUsdaFood(food: UsdaFood): ExternalFood | null {
  const name = cleanText(food.description);
  const calories = cleanNumber(nutrient(food, ENERGY_NUMBERS, 'KCAL'), 900);
  if (!food.fdcId || !name || calories === null) return null; // No energy value → not importable.
  const barcode = food.gtinUpc && /^\d{6,14}$/.test(food.gtinUpc) ? food.gtinUpc : null;
  return {
    source: 'usda',
    sourceId: String(food.fdcId),
    name,
    brand: cleanText(food.brandName ?? food.brandOwner),
    barcode,
    caloriesPer100g: calories,
    proteinPer100g: cleanNumber(nutrient(food, ['203'], 'G'), 100),
    carbsPer100g: cleanNumber(nutrient(food, ['205'], 'G'), 100),
    fatPer100g: cleanNumber(nutrient(food, ['204'], 'G'), 100),
  };
}

export function createUsdaProvider(apiKey: string, fetchImpl: typeof fetch = fetch): FoodProvider {
  return {
    id: 'usda',
    async search(query, signal) {
      const url = new URL('https://api.nal.usda.gov/fdc/v1/foods/search');
      url.searchParams.set('api_key', apiKey);
      url.searchParams.set('query', query);
      url.searchParams.set('pageSize', '25');
      url.searchParams.set('dataType', 'Foundation,SR Legacy,Branded');
      const response = await fetchImpl(url.toString(), { signal });
      if (!response.ok) throw new Error(`USDA search failed: ${response.status}`);
      const body = (await response.json()) as { foods?: UsdaFood[] };
      return (body.foods ?? []).map(mapUsdaFood).filter((f): f is ExternalFood => f !== null);
    },
  };
}
