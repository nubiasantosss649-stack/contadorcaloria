import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import DiaryScreen from '@/app/(app)/(tabs)/diary';
import AddMealScreen from '@/app/(app)/add-meal';
import CreateFoodScreen from '@/app/(app)/create-food';
import { takePendingFood } from '@/features/meals/pending-food';
import { dayKey } from '@/lib/dates';
import { accountService, entitlementsService } from '@/services/account-service';
import { foodsService } from '@/services/foods-service';
import { favoritesService, mealsService } from '@/services/meals-service';

import { createFakeMeals, makeAccount, yogurt } from '../utils/fake-backend';
import { routerMock, searchParams } from '../utils/mocks';
import { renderWithProviders, resetAppState } from '../utils/render';

jest.mock('expo-router', () => require('../utils/mocks').expoRouterMock());
jest.mock('@/lib/env', () => ({ env: { appEnv: 'development' }, isSupabaseConfigured: true }));
jest.mock('@/lib/supabase', () => ({ supabase: null }));
jest.mock('@/services/auth-service', () => ({
  authService: {
    getSession: jest.fn(async () => require('../utils/mocks').testSession),
    onSessionChange: jest.fn(() => () => undefined),
  },
}));
jest.mock('@/services/account-service', () => ({
  accountService: { load: jest.fn() },
  entitlementsService: { hasPro: jest.fn(async () => false) },
}));
jest.mock('@/services/meals-service', () => ({
  mealsService: {},
  favoritesService: {
    list: jest.fn(async () => []),
    create: jest.fn(async () => undefined),
    remove: jest.fn(),
  },
}));
jest.mock('@/services/foods-service', () => ({
  foodsService: { search: jest.fn(), recent: jest.fn(async () => []), create: jest.fn() },
}));

let fake: ReturnType<typeof createFakeMeals>;

beforeEach(async () => {
  jest.clearAllMocks();
  await resetAppState();
  fake = createFakeMeals();
  Object.assign(mealsService, fake);
  jest.mocked(accountService.load).mockResolvedValue(makeAccount());
  jest.mocked(foodsService.search).mockResolvedValue([yogurt]);
  jest.mocked(entitlementsService.hasPro).mockResolvedValue(false);
  searchParams.current = {};
});

describe('Adding foods to a meal', () => {
  it('searches, asks the portion in grams, previews the calculation and saves', async () => {
    searchParams.current = { meal: 'dinner', day: dayKey(new Date()) };
    await renderWithProviders(<AddMealScreen />);

    await fireEvent.changeText(screen.getByTestId('add-meal-search'), 'yog');
    await fireEvent.press(await screen.findByTestId('food-food-yogurt'));
    expect(foodsService.search).toHaveBeenCalledWith('yog');

    await fireEvent.changeText(screen.getByTestId('portion-grams'), '150');
    expect(screen.getByText('300 kcal')).toBeTruthy(); // 200 kcal/100 g × 150 g
    expect(screen.getByText(/Some values are unknown/)).toBeTruthy(); // fat unknown
    await fireEvent.press(screen.getByTestId('portion-confirm'));

    expect(await screen.findByTestId('add-meal-basket')).toBeTruthy();
    await fireEvent.press(screen.getByText('Also save as a favorite meal'));
    await fireEvent.changeText(screen.getByLabelText('Favorite name'), 'Light dinner');
    await fireEvent.press(screen.getByTestId('add-meal-save'));

    await waitFor(() =>
      expect(fake.addItems).toHaveBeenCalledWith('dinner', expect.any(String), [
        { foodId: 'food-yogurt', grams: 150 },
      ]),
    );
    await waitFor(() =>
      expect(favoritesService.create).toHaveBeenCalledWith('Light dinner', 'dinner', [
        { foodId: 'food-yogurt', grams: 150 },
      ]),
    );
    expect(routerMock.back).toHaveBeenCalled();
  });

  it('rejects invalid portions', async () => {
    await renderWithProviders(<AddMealScreen />);
    await fireEvent.changeText(screen.getByTestId('add-meal-search'), 'yog');
    await fireEvent.press(await screen.findByTestId('food-food-yogurt'));
    await fireEvent.changeText(screen.getByTestId('portion-grams'), '0');
    expect(screen.getByText('Enter a portion between 1 and 5000 g.')).toBeTruthy();
    expect(screen.getByTestId('add-meal-save').props.accessibilityState.disabled).toBe(true);
  });

  it('logs a favorite meal with one tap', async () => {
    jest.mocked(favoritesService.list).mockResolvedValue([
      {
        id: 'fav-1',
        name: 'Breakfast bowl',
        mealType: 'breakfast',
        items: [{ food: yogurt, grams: 200 }],
      },
    ]);
    searchParams.current = { meal: 'breakfast' };
    await renderWithProviders(<AddMealScreen />);
    await fireEvent.press(screen.getByText('Favorites'));
    await fireEvent.press(await screen.findByTestId('favorite-fav-1'));
    await fireEvent.press(screen.getByTestId('add-meal-save'));
    await waitFor(() =>
      expect(fake.addItems).toHaveBeenCalledWith('breakfast', expect.any(String), [
        { foodId: 'food-yogurt', grams: 200 },
      ]),
    );
  });
});

describe('Manual food registration', () => {
  it('validates and creates a food without inventing unknown macros', async () => {
    const created = { ...yogurt, id: 'food-new', name: 'Homemade bread' };
    jest.mocked(foodsService.create).mockResolvedValue(created);
    await renderWithProviders(<CreateFoodScreen />);

    await fireEvent.press(screen.getByTestId('create-food-save'));
    expect(await screen.findByText('Enter the food name.')).toBeTruthy();

    await fireEvent.changeText(screen.getByTestId('create-food-name'), 'Homemade bread');
    await fireEvent.changeText(screen.getByTestId('create-food-calories'), '265');
    await fireEvent.changeText(screen.getByTestId('create-food-protein'), '9,4');
    await fireEvent.press(screen.getByTestId('create-food-save'));

    await waitFor(() =>
      expect(foodsService.create).toHaveBeenCalledWith({
        name: 'Homemade bread',
        brand: null,
        barcode: null,
        caloriesPer100g: 265,
        proteinPer100g: 9.4,
        carbsPer100g: null,
        fatPer100g: null,
      }),
    );
    expect(takePendingFood()).toEqual(created); // handed back to the add-meal screen
  });
});

describe('Diary history', () => {
  it('Free plan cannot navigate beyond 7 days and is offered Pro', async () => {
    const { queryClient } = await renderWithProviders(<DiaryScreen />);
    await waitFor(() => expect(entitlementsService.hasPro).toHaveBeenCalled());
    for (let i = 0; i < 6; i += 1) await fireEvent.press(screen.getByTestId('diary-previous'));
    await waitFor(() => expect(queryClient.isFetching()).toBe(0));
    expect(screen.getByTestId('diary-previous').props.accessibilityState.disabled).toBe(true);
    expect(screen.getByTestId('diary-history-limit')).toBeTruthy();
    // Every day requested from the server is within the window.
    const oldest = Math.min(
      ...fake.listRange.mock.calls.map((call) => new Date(call[0]).getTime()),
    );
    expect(Date.now() - oldest).toBeLessThan(7 * 24 * 3600 * 1000);
  });

  it('Pro (validated by the server) can go further back', async () => {
    jest.mocked(entitlementsService.hasPro).mockResolvedValue(true);
    const { queryClient } = await renderWithProviders(<DiaryScreen />);
    await waitFor(() => expect(entitlementsService.hasPro).toHaveBeenCalled());
    for (let i = 0; i < 8; i += 1) await fireEvent.press(screen.getByTestId('diary-previous'));
    await waitFor(() => expect(queryClient.isFetching()).toBe(0));
    expect(screen.queryByTestId('diary-history-limit')).toBeNull();
    expect(screen.getByTestId('diary-previous').props.accessibilityState.disabled).toBe(false);
  });

  it('shows the day total from logged items', async () => {
    await fake.addItems('snack', new Date().toISOString(), [{ foodId: yogurt.id, grams: 50 }]);
    const { queryClient } = await renderWithProviders(<DiaryScreen />);
    await waitFor(() => expect(screen.getByTestId('diary-total').props.children).toBe('100 kcal'));
    await waitFor(() => expect(queryClient.isFetching()).toBe(0));
  });
});
