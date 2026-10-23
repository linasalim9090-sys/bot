import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { assertNoEmoji } from '../ui/emoji.js';

export type Locale = 'ar' | 'en';
export type Messages = Record<string, string>;
export type Translator = (key: string, vars?: Record<string, string | number>) => string;

let cached: Record<Locale, Messages> | undefined;

export function loadLocales(): Record<Locale, Messages> {
  if (cached) return cached;
  const read = (locale: Locale): Messages =>
    JSON.parse(
      readFileSync(fileURLToPath(new URL(`./${locale}.json`, import.meta.url)), 'utf8'),
    ) as Messages;
  cached = { ar: read('ar'), en: read('en') };
  return cached;
}

export function flattenKeys(value: unknown, prefix = ''): string[] {
  if (typeof value !== 'object' || value === null) return prefix ? [prefix] : [];
  return Object.entries(value).flatMap(([key, child]) =>
    flattenKeys(child, prefix ? `${prefix}.${key}` : key),
  );
}

export function createTranslator(locale: Locale): Translator {
  const locales = loadLocales();
  const primary = locales[locale] ?? locales.ar;
  const fallback = locales.en;
  return (key, vars) => {
    const template = primary[key] ?? fallback[key] ?? key;
    if (process.env.NODE_ENV !== 'production') assertNoEmoji(template);
    return template.replace(/\{(\w+)\}/g, (_match, name: string) =>
      vars && name in vars ? String(vars[name]) : `{${name}}`,
    );
  };
}
