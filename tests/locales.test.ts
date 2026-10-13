import enUS from '@/locales/en-US';
import es from '@/locales/es';
import ptBR from '@/locales/pt-BR';

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ''): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((acc, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === 'string'
      ? { ...acc, [path]: value }
      : { ...acc, ...flatten(value, path) };
  }, {});
}

const placeholders = (text: string) => (text.match(/{{\s*\w+\s*}}/g) ?? []).sort();

const base = flatten(enUS);
const locales = { 'pt-BR': flatten(ptBR), es: flatten(es) };

describe.each(Object.entries(locales))('%s translations', (_name, locale) => {
  it('has exactly the same keys as en-US', () => {
    expect(Object.keys(locale).sort()).toEqual(Object.keys(base).sort());
  });

  it('has no empty strings', () => {
    expect(Object.entries(locale).filter(([, value]) => !value.trim())).toEqual([]);
  });

  it('keeps the same interpolation placeholders', () => {
    for (const [key, value] of Object.entries(base)) {
      expect({ key, placeholders: placeholders(locale[key] ?? '') }).toEqual({
        key,
        placeholders: placeholders(value),
      });
    }
  });
});
