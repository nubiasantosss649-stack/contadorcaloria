import type {
  Account,
  GoalsInput,
  HealthProfile,
  NutritionGoals,
  OnboardingAnswers,
  Profile,
  RemotePreferences,
  WeightLog,
} from '@/features/account/types';
import { birthYearFromAge } from '@/lib/energy';
import { isAppLanguage } from '@/lib/i18n/languages';
import type { Tables } from '@/types/database';

import { requireUser } from './client';
import { ServiceError, unwrap, unwrapMaybe } from './errors';
import { toNumber } from './mappers';

function mapProfile(row: Tables<'profiles'>): Profile {
  return {
    id: row.id,
    displayName: row.display_name,
    email: row.email,
    language: isAppLanguage(row.language) ? row.language : 'en-US',
    country: row.country,
    onboardingCompletedAt: row.onboarding_completed_at,
    createdAt: row.created_at,
  };
}

function mapGoals(row: Tables<'nutrition_goals'>): NutritionGoals {
  return {
    dailyCalorieTarget: row.daily_calorie_target,
    proteinTarget: toNumber(row.protein_target),
    carbTarget: toNumber(row.carb_target),
    fatTarget: toNumber(row.fat_target),
    source: row.source,
    updatedAt: row.updated_at,
  };
}

function mapWeight(
  row: Pick<Tables<'weight_logs'>, 'id' | 'weight_kg' | 'recorded_at'>,
): WeightLog {
  return { id: row.id, weightKg: toNumber(row.weight_kg) ?? 0, recordedAt: row.recorded_at };
}

export const accountService = {
  async load(): Promise<Account> {
    const { client, userId } = await requireUser();
    const [profile, preferences, health, goals, weight] = await Promise.all([
      client.from('profiles').select('*').eq('id', userId).single(),
      client.from('user_preferences').select('*').eq('user_id', userId).maybeSingle(),
      client.from('health_profiles').select('*').eq('user_id', userId).maybeSingle(),
      client.from('nutrition_goals').select('*').eq('user_id', userId).maybeSingle(),
      client
        .from('weight_logs')
        .select('id, weight_kg, recorded_at')
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    const prefs = unwrapMaybe(preferences);
    const healthRow = unwrapMaybe(health);
    const goalsRow = unwrapMaybe(goals);
    const weightRow = unwrapMaybe(weight);
    return {
      profile: mapProfile(unwrap(profile)),
      preferences: prefs
        ? {
            unitSystem: prefs.unit_system,
            theme: prefs.theme,
            notificationPreferences:
              prefs.notification_preferences && typeof prefs.notification_preferences === 'object'
                ? (prefs.notification_preferences as Record<string, unknown>)
                : {},
          }
        : null,
      health: healthRow
        ? {
            goal: healthRow.goal,
            sex: healthRow.sex,
            birthYear: healthRow.birth_year,
            heightCm: toNumber(healthRow.height_cm),
            activityLevel: healthRow.activity_level,
          }
        : null,
      goals: goalsRow ? mapGoals(goalsRow) : null,
      latestWeight: weightRow ? mapWeight(weightRow) : null,
    };
  },

  async updateProfile(
    changes: Partial<Pick<Profile, 'displayName' | 'language' | 'country'>>,
  ): Promise<void> {
    const { client, userId } = await requireUser();
    const update: {
      display_name?: string | null;
      language?: Profile['language'];
      country?: string | null;
    } = {};
    if (changes.displayName !== undefined) {
      const name = changes.displayName?.trim() ?? '';
      if (name.length > 80) throw new ServiceError('validation', 'name too long');
      update.display_name = name || null;
    }
    if (changes.language !== undefined) update.language = changes.language;
    if (changes.country !== undefined) update.country = changes.country;
    unwrap(await client.from('profiles').update(update).eq('id', userId).select('id').single());
  },

  async savePreferences(changes: Partial<RemotePreferences>): Promise<void> {
    const { client, userId } = await requireUser();
    unwrap(
      await client
        .from('user_preferences')
        .upsert({
          user_id: userId,
          ...(changes.unitSystem ? { unit_system: changes.unitSystem } : {}),
          ...(changes.theme ? { theme: changes.theme } : {}),
        })
        .select('user_id')
        .single(),
    );
  },

  async saveHealth(health: HealthProfile): Promise<void> {
    const { client, userId } = await requireUser();
    unwrap(
      await client
        .from('health_profiles')
        .upsert({
          user_id: userId,
          goal: health.goal,
          sex: health.sex,
          birth_year: health.birthYear,
          height_cm: health.heightCm,
          activity_level: health.activityLevel,
        })
        .select('user_id')
        .single(),
    );
  },

  async saveGoals(goals: GoalsInput): Promise<void> {
    const { client, userId } = await requireUser();
    unwrap(
      await client
        .from('nutrition_goals')
        .upsert({
          user_id: userId,
          daily_calorie_target: Math.round(goals.dailyCalorieTarget),
          protein_target: goals.proteinTarget,
          carb_target: goals.carbTarget,
          fat_target: goals.fatTarget,
          source: goals.source,
        })
        .select('user_id')
        .single(),
    );
  },

  async logWeight(weightKg: number, recordedAt?: string): Promise<void> {
    const { client } = await requireUser();
    unwrap(
      await client
        .from('weight_logs')
        .insert({
          weight_kg: Math.round(weightKg * 100) / 100,
          ...(recordedAt ? { recorded_at: recordedAt } : {}),
        })
        .select('id')
        .single(),
    );
  },

  async listWeights(since: string): Promise<WeightLog[]> {
    const { client } = await requireUser();
    const rows = unwrap(
      await client
        .from('weight_logs')
        .select('id, weight_kg, recorded_at')
        .gte('recorded_at', since)
        .order('recorded_at', { ascending: true }),
    );
    return rows.map(mapWeight);
  },

  async deleteWeight(id: string): Promise<void> {
    const { client } = await requireUser();
    unwrap(await client.from('weight_logs').delete().eq('id', id).select('id'));
  },

  /**
   * Saves the onboarding answers. The completion flag is written last, so an interrupted
   * save simply shows the questionnaire again.
   */
  async completeOnboarding(answers: OnboardingAnswers, goals: GoalsInput | null): Promise<void> {
    const { client, userId } = await requireUser();
    await accountService.saveHealth({
      goal: answers.goal,
      sex: answers.sex,
      birthYear: answers.age === null ? null : birthYearFromAge(answers.age),
      heightCm: answers.heightCm,
      activityLevel: answers.activityLevel,
    });
    await accountService.savePreferences({ unitSystem: answers.unitSystem });
    if (answers.weightKg !== null) await accountService.logWeight(answers.weightKg);
    if (goals) await accountService.saveGoals(goals);
    unwrap(
      await client
        .from('profiles')
        .update({
          language: answers.language,
          country: answers.country,
          onboarding_completed_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select('id')
        .single(),
    );
  },
};

export const entitlementsService = {
  /**
   * Whether the user has an active Pro entitlement. Evaluated by the database
   * (has_pro_access) from rows only the service role can write — never from local state.
   */
  async hasPro(): Promise<boolean> {
    const { client } = await requireUser();
    const result = await client.rpc('has_pro_access');
    return result.error ? false : result.data === true;
  },
};
