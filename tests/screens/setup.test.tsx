import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import SetupScreen from '@/app/(app)/setup';
import { accountService } from '@/services/account-service';

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
  accountService: { completeOnboarding: jest.fn(async () => undefined), load: jest.fn() },
  entitlementsService: { hasPro: jest.fn(async () => false) },
}));

const account = jest.mocked(accountService);

beforeEach(async () => {
  jest.clearAllMocks();
  await resetAppState();
});

const press = (id: string) => fireEvent.press(screen.getByTestId(id));
const next = () => press('setup-continue');

describe('Onboarding questionnaire', () => {
  it('asks every question and saves the Mifflin-St Jeor estimate', async () => {
    await renderWithProviders(<SetupScreen />);
    expect(await screen.findByText('What is your goal?')).toBeTruthy();
    await press('setup-goal-lose');
    await next();

    await fireEvent.changeText(screen.getByTestId('setup-age'), '30');
    await next();
    await press('setup-sex-female');
    await next();

    // US device → imperial by default; switch to metric for this test.
    await fireEvent.press(screen.getByText('Use kg / cm instead'));
    await fireEvent.changeText(screen.getByTestId('setup-height'), '165');
    await next();
    await fireEvent.changeText(screen.getByTestId('setup-weight'), '65');
    await next();
    await press('setup-activity-moderate');
    await next();
    expect(screen.getByText('Where do you live?')).toBeTruthy();
    await next(); // country (pre-filled from device: US)
    await press('setup-language-pt-BR');
    expect(await screen.findByText('Idioma preferido')).toBeTruthy(); // language switches live
    await next();
    expect(screen.getByText('Sistema de medidas')).toBeTruthy();
    await next();

    expect(await screen.findByTestId('goal-estimate')).toBeTruthy();
    expect(screen.getByText('1620')).toBeTruthy();
    expect(screen.getByTestId('goal-disclaimer')).toBeTruthy();
    await press('goal-use-estimate');

    await waitFor(() => expect(account.completeOnboarding).toHaveBeenCalledTimes(1));
    expect(account.completeOnboarding).toHaveBeenCalledWith(
      {
        goal: 'lose',
        age: 30,
        sex: 'female',
        heightCm: 165,
        weightKg: 65,
        activityLevel: 'moderate',
        country: 'US',
        language: 'pt-BR',
        unitSystem: 'metric',
      },
      {
        dailyCalorieTarget: 1620,
        proteinTarget: 101,
        carbTarget: 182,
        fatTarget: 54,
        source: 'estimate',
      },
    );
  });

  it('lets the user skip questions, explains what is missing and accepts a safe manual goal', async () => {
    await renderWithProviders(<SetupScreen />);
    for (let i = 0; i < 7; i += 1) await press('setup-skip'); // goal … country
    await next(); // language
    await next(); // units

    expect(await screen.findByTestId('goal-missing')).toBeTruthy();
    expect(screen.getByText('Activity level')).toBeTruthy();

    await fireEvent.press(screen.getByText('Manual'));
    await fireEvent.changeText(screen.getByTestId('goal-manual-input'), '900');
    await press('goal-save-manual');
    expect(await screen.findByText('For safety, the minimum target is 1200 kcal.')).toBeTruthy();
    expect(account.completeOnboarding).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByTestId('goal-manual-input'), '1800');
    await press('goal-save-manual');
    await waitFor(() => expect(account.completeOnboarding).toHaveBeenCalled());
    const [answers, goals] = account.completeOnboarding.mock.calls[0]!;
    expect(answers).toMatchObject({
      goal: null,
      age: null,
      sex: null,
      heightCm: null,
      weightKg: null,
      country: null,
    });
    expect(goals).toMatchObject({ dailyCalorieTarget: 1800, source: 'manual' });
  });

  it('can finish without a goal', async () => {
    await renderWithProviders(<SetupScreen />);
    for (let i = 0; i < 7; i += 1) await press('setup-skip');
    await next();
    await next();
    await press('setup-finish-without-goal');
    await waitFor(() =>
      expect(account.completeOnboarding).toHaveBeenCalledWith(expect.any(Object), null),
    );
  });

  it('blocks invalid ages', async () => {
    await renderWithProviders(<SetupScreen />);
    await press('setup-skip');
    await fireEvent.changeText(screen.getByTestId('setup-age'), '7');
    expect(await screen.findByText('Enter an age between 13 and 120.')).toBeTruthy();
  });
});
