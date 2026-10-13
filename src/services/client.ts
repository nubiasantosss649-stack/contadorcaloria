import { supabase, type AppSupabaseClient } from '@/lib/supabase';

import { ServiceError } from './errors';

export function requireClient(): AppSupabaseClient {
  if (!supabase) throw new ServiceError('not_configured');
  return supabase;
}

/** Returns the client and the signed-in user's id (from the locally validated session). */
export async function requireUser(): Promise<{ client: AppSupabaseClient; userId: string }> {
  const client = requireClient();
  const { data } = await client.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) throw new ServiceError('not_authenticated');
  return { client, userId };
}
