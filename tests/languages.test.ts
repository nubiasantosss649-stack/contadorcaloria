import { isAppLanguage, resolveFromDeviceTags, resolveLanguage } from '@/lib/i18n/languages';

describe('language resolution', () => {
  it('maps BCP-47 tags to supported languages', () => {
    expect(resolveLanguage('en-US')).toBe('en-US');
    expect(resolveLanguage('en-GB')).toBe('en-US');
    expect(resolveLanguage('pt-BR')).toBe('pt-BR');
    expect(resolveLanguage('pt-PT')).toBe('pt-BR');
    expect(resolveLanguage('es-MX')).toBe('es');
    expect(resolveLanguage('es_ES')).toBe('es');
    expect(resolveLanguage('fr-FR')).toBe('en-US');
    expect(resolveLanguage(undefined)).toBe('en-US');
  });

  it('uses the first supported device locale', () => {
    expect(resolveFromDeviceTags(['fr-FR', 'es-AR', 'en-US'])).toBe('es');
    expect(resolveFromDeviceTags(['de-DE', 'ja-JP'])).toBe('en-US');
    expect(resolveFromDeviceTags([null, 'pt-BR'])).toBe('pt-BR');
    expect(resolveFromDeviceTags([])).toBe('en-US');
  });

  it('guards persisted values', () => {
    expect(isAppLanguage('pt-BR')).toBe(true);
    expect(isAppLanguage('pt')).toBe(false);
    expect(isAppLanguage(42)).toBe(false);
  });
});
