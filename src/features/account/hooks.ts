import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/auth-provider';
import { queryKeys } from '@/lib/query-client';
import { accountService, entitlementsService } from '@/services/account-service';

import type {
  GoalsInput,
  HealthProfile,
  OnboardingAnswers,
  Profile,
  RemotePreferences,
} from './types';

export function useUserId(): string | null {
  const { session } = useAuth();
  return session?.user.id ?? null;
}

export function useAccount() {
  const userId = useUserId();
  return useQuery({
    queryKey: queryKeys.account(userId ?? 'none'),
    queryFn: accountService.load,
    enabled: userId !== null,
  });
}

function useAccountMutation<TVariables>(fn: (variables: TVariables) => Promise<void>) {
  const userId = useUserId();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.account(userId ?? 'none') }),
  });
}

export const useUpdateProfile = () =>
  useAccountMutation((changes: Partial<Pick<Profile, 'displayName' | 'language' | 'country'>>) =>
    accountService.updateProfile(changes),
  );
export const useSavePreferences = () =>
  useAccountMutation((changes: Partial<RemotePreferences>) =>
    accountService.savePreferences(changes),
  );
export const useSaveHealth = () =>
  useAccountMutation((health: HealthProfile) => accountService.saveHealth(health));
export const useSaveGoals = () =>
  useAccountMutation((goals: GoalsInput) => accountService.saveGoals(goals));
export const useCompleteOnboarding = () =>
  useAccountMutation(
    ({ answers, goals }: { answers: OnboardingAnswers; goals: GoalsInput | null }) =>
      accountService.completeOnboarding(answers, goals),
  );

export function useLogWeight() {
  const userId = useUserId() ?? 'none';
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (weightKg: number) => accountService.logWeight(weightKg),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.account(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.weightsAll(userId) }),
      ]),
  });
}

export function useWeights(since: string) {
  const userId = useUserId();
  return useQuery({
    queryKey: queryKeys.weights(userId ?? 'none', since),
    queryFn: () => accountService.listWeights(since),
    enabled: userId !== null,
  });
}

/** Pro access as reported by the server. Defaults to false while loading or on error. */
export function useHasPro(): { hasPro: boolean; isLoading: boolean } {
  const userId = useUserId();
  const query = useQuery({
    queryKey: queryKeys.entitlement(userId ?? 'none'),
    queryFn: entitlementsService.hasPro,
    enabled: userId !== null,
    staleTime: 5 * 60_000,
  });
  return { hasPro: query.data === true, isLoading: query.isLoading };
}
