export const SUPPORTED_LANGUAGES = ['en-US', 'pt-BR', 'es'] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: AppLanguage = 'en-US';

export function isAppLanguage(value: unknown): value is AppLanguage {
  return typeof value === 'string' && (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

/**
 * Maps a BCP-47 tag (e.g. "pt-PT", "es-MX", "en-GB") to the closest supported language.
 * Any Portuguese variant → pt-BR, any Spanish variant → es, everything else → en-US.
 */
export function resolveLanguage(tag: string | null | undefined): AppLanguage {
  if (!tag) return DEFAULT_LANGUAGE;
  const primary = tag.toLowerCase().split(/[-_]/)[0];
  if (primary === 'pt') return 'pt-BR';
  if (primary === 'es') return 'es';
  return DEFAULT_LANGUAGE;
}

/** Picks the first device locale we support, falling back to en-US. */
export function resolveFromDeviceTags(tags: readonly (string | null | undefined)[]): AppLanguage {
  for (const tag of tags) {
    if (!tag) continue;
    const primary = tag.toLowerCase().split(/[-_]/)[0];
    if (primary === 'pt' || primary === 'es' || primary === 'en') return resolveLanguage(tag);
  }
  return DEFAULT_LANGUAGE;
}
