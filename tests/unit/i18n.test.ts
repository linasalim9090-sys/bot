import { describe, expect, it } from 'vitest';
import { createTranslator, flattenKeys, loadLocales } from '../../src/i18n/index.js';
import { containsEmoji } from '../../src/ui/emoji.js';

describe('i18n', () => {
  it('has identical key sets in Arabic and English', () => {
    const locales = loadLocales();
    expect(flattenKeys(locales.ar).sort()).toEqual(flattenKeys(locales.en).sort());
  });

  it('contains no emoji in any locale value', () => {
    const locales = loadLocales();
    for (const messages of Object.values(locales)) {
      for (const value of Object.values(messages)) {
        expect(containsEmoji(value), value).toBe(false);
      }
    }
  });

  it('interpolates variables', () => {
    const t = createTranslator('ar');
    expect(t('errors.cooldown', { seconds: 5 })).toContain('5');
  });

  it('falls back to the key when missing', () => {
    const t = createTranslator('ar');
    expect(t('missing.key')).toBe('missing.key');
  });
});
