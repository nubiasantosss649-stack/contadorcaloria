import { cleanNumber, cleanText, KJ_PER_KCAL, type ExternalFood, type FoodProvider } from './types';

/**
 * Open Food Facts — https://openfoodfacts.github.io/openfoodfacts-server/api/
 * Data is crowd-sourced (ODbL licence): show the source and let users report errors.
 */
export type OffProduct = {
  code?: string;
  product_name?: string;
  generic_name?: string;
  brands?: string;
  nutriments?: Record<string, unknown>;
};

export function mapOffProduct(product: OffProduct): ExternalFood | null {
  const n = product.nutriments ?? {};
  const name = cleanText(product.product_name) ?? cleanText(product.generic_name);
  let calories = cleanNumber(n['energy-kcal_100g'], 900);
  if (calories === null) {
    // Exact unit conversion from kJ (not an estimate).
    const kj = cleanNumber(n['energy-kj_100g'], 900 * KJ_PER_KCAL);
    calories = kj === null ? null : Math.round((kj / KJ_PER_KCAL) * 10) / 10;
  }
  if (!product.code || !name || calories === null) return null;
  return {
    source: 'open_food_facts',
    sourceId: product.code,
    name,
    brand: cleanText(product.brands?.split(',')[0]),
    barcode: /^\d{6,14}$/.test(product.code) ? product.code : null,
    caloriesPer100g: calories,
    proteinPer100g: cleanNumber(n['proteins_100g'], 100),
    carbsPer100g: cleanNumber(n['carbohydrates_100g'], 100),
    fatPer100g: cleanNumber(n['fat_100g'], 100),
  };
}

export function createOpenFoodFactsProvider(
  userAgent: string,
  fetchImpl: typeof fetch = fetch,
): FoodProvider {
  return {
    id: 'open_food_facts',
    async search(query, signal) {
      const url = new URL('https://world.openfoodfacts.org/cgi/search.pl');
      url.searchParams.set('search_terms', query);
      url.searchParams.set('search_simple', '1');
      url.searchParams.set('json', '1');
      url.searchParams.set('page_size', '25');
      url.searchParams.set('fields', 'code,product_name,generic_name,brands,nutriments');
      // OFF asks every client to identify itself.
      const response = await fetchImpl(url.toString(), {
        signal,
        headers: { 'User-Agent': userAgent },
      });
      if (!response.ok) throw new Error(`Open Food Facts search failed: ${response.status}`);
      const body = (await response.json()) as { products?: OffProduct[] };
      return (body.products ?? []).map(mapOffProduct).filter((f): f is ExternalFood => f !== null);
    },
  };
}
