import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import HomeScreen from '@/app/(app)/(tabs)/index';
import { accountService } from '@/services/account-service';
import { mealsService } from '@/services/meals-service';

import { createFakeMeals, makeAccount, yogurt } from '../utils/fake-backend';
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
jest.mock('@/services/meals-service', () => ({ mealsService: {}, favoritesService: {} }));

let fake: ReturnType<typeof createFakeMeals>;

beforeEach(async () => {
  jest.clearAllMocks();
  await resetAppState();
  fake = createFakeMeals();
  Object.assign(mealsService, fake);
  jest.mocked(accountService.load).mockResolvedValue(makeAccount());
});

const text = (testID: string) => screen.getByTestId(testID).props.children;

describe('Dashboard', () => {
  it('shows goal, consumed, remaining, macros and meal summaries from the diary', async () => {
    await fake.addItems('lunch', new Date().toISOString(), [{ foodId: yogurt.id, grams: 150 }]);
    await renderWithProviders(<HomeScreen />);

    await waitFor(() => expect(text('home-consumed')).toBe(300));
    expect(text('home-goal')).toBe(2000);
    expect(text('home-remaining')).toBe(1700);
    expect(screen.getByText('15 g / 125 g')).toBeTruthy(); // protein
    expect(screen.getByText('6 g / 225 g')).toBeTruthy(); // carbs
    // Fat is unknown for this food: totals are flagged as incomplete instead of inventing values.
    expect(screen.getByText(/unknown macronutrient values/)).toBeTruthy();
    expect(screen.getByTestId('meal-total-lunch').props.children).toBe('300 kcal');
    expect(screen.getByTestId('meal-total-breakfast').props.children).toBe('0 kcal');
  });

  it('updates automatically when an item is edited and when it is deleted', async () => {
    await fake.addItems('breakfast', new Date().toISOString(), [{ foodId: yogurt.id, grams: 150 }]);
    await renderWithProviders(<HomeScreen />);
    await waitFor(() => expect(text('home-consumed')).toBe(300));

    const itemId = fake.entries[0]!.items[0]!.id;
    await fireEvent.press(screen.getByTestId(`meal-item-${itemId}`));
    await fireEvent.changeText(screen.getByTestId('meal-item-grams'), '50');
    expect(screen.getByTestId('meal-item-preview')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('meal-item-save'));

    await waitFor(() => expect(text('home-consumed')).toBe(100));
    expect(fake.updateItemQuantity).toHaveBeenCalledWith(itemId, 50);
    expect(text('home-remaining')).toBe(1900);

    await fireEvent.press(screen.getByTestId(`meal-item-${itemId}`));
    await fireEvent.press(screen.getByTestId('meal-item-delete'));
    await fireEvent.press(screen.getByTestId('meal-item-confirm-delete'));
    await waitFor(() => expect(text('home-consumed')).toBe(0));
    expect(text('home-remaining')).toBe(2000);
  });

  it('shows "over goal" when the target is exceeded', async () => {
    await fake.addItems('dinner', new Date().toISOString(), [{ foodId: yogurt.id, grams: 1100 }]);
    await renderWithProviders(<HomeScreen />);
    await waitFor(() => expect(text('home-consumed')).toBe(2200));
    expect(screen.getByText('Over goal')).toBeTruthy();
    expect(text('home-remaining')).toBe(200);
  });

  it('invites the user to set a goal when there is none', async () => {
    jest.mocked(accountService.load).mockResolvedValue(makeAccount({ goals: null }));
    await renderWithProviders(<HomeScreen />);
    expect(await screen.findByText('Set your daily goal')).toBeTruthy();
    expect(text('home-goal')).toBe('—');
  });
});
