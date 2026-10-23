import { describe, expect, it } from 'vitest';
import { formatDuration } from '../../src/core/format.js';
import { createTranslator } from '../../src/i18n/index.js';

const t = createTranslator('ar');

describe('formatDuration', () => {
  it('formats seconds, minutes, hours, and days through i18n', () => {
    expect(formatDuration(5_000, t)).toBe('5 ثانية');
    expect(formatDuration(65_000, t)).toBe('1 دقيقة و5 ثانية');
    expect(formatDuration(3_665_000, t)).toBe('1 ساعة و1 دقيقة و5 ثانية');
    expect(formatDuration(90_061_000, t)).toBe('1 يوم و1 ساعة و1 دقيقة و1 ثانية');
  });
});
