import type { ActivityLevel, Goal, Sex } from '@/lib/energy';
import type { AppLanguage } from '@/lib/i18n/languages';
import type { UnitSystem } from '@/lib/units';

export type Profile = {
  id: string;
  displayName: string | null;
  email: string | null;
  language: AppLanguage;
  country: string | null;
  onboardingCompletedAt: string | null;
  createdAt: string;
};

export type RemotePreferences = {
  unitSystem: UnitSystem;
  theme: 'system' | 'light' | 'dark';
  notificationPreferences: Record<string, unknown>;
};

export type HealthProfile = {
  goal: Goal | null;
  sex: Sex | null;
  birthYear: number | null;
  heightCm: number | null;
  activityLevel: ActivityLevel | null;
};

export type NutritionGoals = {
  dailyCalorieTarget: number;
  proteinTarget: number | null;
  carbTarget: number | null;
  fatTarget: number | null;
  source: 'estimate' | 'manual';
  updatedAt: string;
};

export type WeightLog = { id: string; weightKg: number; recordedAt: string };

export type Account = {
  profile: Profile;
  preferences: RemotePreferences | null;
  health: HealthProfile | null;
  goals: NutritionGoals | null;
  latestWeight: WeightLog | null;
};

export type OnboardingAnswers = {
  goal: Goal | null;
  age: number | null;
  sex: Sex | null;
  heightCm: number | null;
  weightKg: number | null;
  activityLevel: ActivityLevel | null;
  country: string | null;
  language: AppLanguage;
  unitSystem: UnitSystem;
};

export type GoalsInput = {
  dailyCalorieTarget: number;
  proteinTarget: number | null;
  carbTarget: number | null;
  fatTarget: number | null;
  source: 'estimate' | 'manual';
};
