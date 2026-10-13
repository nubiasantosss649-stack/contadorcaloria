/**
 * Normalised errors for every service call. UI code maps `code` to a translated message
 * (see useErrorMessage) and never shows raw database messages to the user.
 */
export type ServiceErrorCode =
  | 'not_configured'
  | 'not_authenticated'
  | 'network'
  | 'validation'
  | 'forbidden'
  | 'in_use'
  | 'not_found'
  | 'rate_limited'
  | 'unknown';

export class ServiceError extends Error {
  readonly code: ServiceErrorCode;
  override readonly cause?: unknown;

  constructor(code: ServiceErrorCode, message?: string, cause?: unknown) {
    super(message ?? code);
    this.name = 'ServiceError';
    this.code = code;
    this.cause = cause;
  }
}

type PostgrestLikeError = { code?: string; message?: string; status?: number; name?: string };

/** Maps PostgREST / Postgres / fetch errors to a ServiceError. */
export function toServiceError(error: unknown): ServiceError {
  if (error instanceof ServiceError) return error;
  const e = (error ?? {}) as PostgrestLikeError;
  const message = typeof e.message === 'string' ? e.message : undefined;

  if (error instanceof TypeError || /network|fetch failed|Failed to fetch/i.test(message ?? '')) {
    return new ServiceError('network', message, error);
  }
  switch (e.code) {
    case '23514': // check_violation
    case '23502': // not_null_violation
    case '22P02': // invalid_text_representation
    case '22003': // numeric_value_out_of_range
      return new ServiceError('validation', message, error);
    case '23503': // foreign_key_violation
      return new ServiceError('in_use', message, error);
    case '42501': // insufficient_privilege / RLS
      return new ServiceError('forbidden', message, error);
    case 'PGRST116': // no rows for .single()
      return new ServiceError('not_found', message, error);
    case 'PGRST301':
      return new ServiceError('not_authenticated', message, error);
  }
  if (e.status === 401) return new ServiceError('not_authenticated', message, error);
  if (e.status === 429) return new ServiceError('rate_limited', message, error);
  return new ServiceError('unknown', message, error);
}

/** Unwraps a Supabase `{ data, error }` response, throwing a ServiceError on failure. */
export function unwrap<T>(response: { data: T; error: unknown }): NonNullable<T> {
  if (response.error) throw toServiceError(response.error);
  if (response.data === null || response.data === undefined) throw new ServiceError('not_found');
  return response.data as NonNullable<T>;
}

/** Like unwrap, but a missing row (maybeSingle) is returned as null. */
export function unwrapMaybe<T>(response: { data: T | null; error: unknown }): T | null {
  if (response.error) throw toServiceError(response.error);
  return response.data ?? null;
}
