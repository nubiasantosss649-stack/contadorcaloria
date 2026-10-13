import type { AppLanguage } from '@/lib/i18n/languages';

/** ISO 3166-1 alpha-2 codes with names in each supported language (data, not UI copy). */
type Country = { code: string; names: Record<AppLanguage, string> };

const c = (code: string, en: string, pt: string, es: string): Country => ({
  code,
  names: { 'en-US': en, 'pt-BR': pt, es },
});

export const COUNTRIES: readonly Country[] = [
  c('US', 'United States', 'Estados Unidos', 'Estados Unidos'),
  c('BR', 'Brazil', 'Brasil', 'Brasil'),
  c('MX', 'Mexico', 'México', 'México'),
  c('CA', 'Canada', 'Canadá', 'Canadá'),
  c('AR', 'Argentina', 'Argentina', 'Argentina'),
  c('CO', 'Colombia', 'Colômbia', 'Colombia'),
  c('CL', 'Chile', 'Chile', 'Chile'),
  c('PE', 'Peru', 'Peru', 'Perú'),
  c('VE', 'Venezuela', 'Venezuela', 'Venezuela'),
  c('EC', 'Ecuador', 'Equador', 'Ecuador'),
  c('UY', 'Uruguay', 'Uruguai', 'Uruguay'),
  c('PY', 'Paraguay', 'Paraguai', 'Paraguay'),
  c('BO', 'Bolivia', 'Bolívia', 'Bolivia'),
  c('CR', 'Costa Rica', 'Costa Rica', 'Costa Rica'),
  c('DO', 'Dominican Republic', 'República Dominicana', 'República Dominicana'),
  c('GT', 'Guatemala', 'Guatemala', 'Guatemala'),
  c('PA', 'Panama', 'Panamá', 'Panamá'),
  c('PR', 'Puerto Rico', 'Porto Rico', 'Puerto Rico'),
  c('ES', 'Spain', 'Espanha', 'España'),
  c('PT', 'Portugal', 'Portugal', 'Portugal'),
  c('GB', 'United Kingdom', 'Reino Unido', 'Reino Unido'),
  c('IE', 'Ireland', 'Irlanda', 'Irlanda'),
  c('FR', 'France', 'França', 'Francia'),
  c('DE', 'Germany', 'Alemanha', 'Alemania'),
  c('IT', 'Italy', 'Itália', 'Italia'),
  c('NL', 'Netherlands', 'Países Baixos', 'Países Bajos'),
  c('CH', 'Switzerland', 'Suíça', 'Suiza'),
  c('AO', 'Angola', 'Angola', 'Angola'),
  c('MZ', 'Mozambique', 'Moçambique', 'Mozambique'),
  c('AU', 'Australia', 'Austrália', 'Australia'),
  c('NZ', 'New Zealand', 'Nova Zelândia', 'Nueva Zelanda'),
  c('JP', 'Japan', 'Japão', 'Japón'),
  c('IN', 'India', 'Índia', 'India'),
  c('ZA', 'South Africa', 'África do Sul', 'Sudáfrica'),
];

export function countryName(code: string | null, language: AppLanguage): string | null {
  if (!code) return null;
  return COUNTRIES.find((country) => country.code === code)?.names[language] ?? code;
}

export function isKnownCountry(code: string | null | undefined): code is string {
  return !!code && COUNTRIES.some((country) => country.code === code);
}
