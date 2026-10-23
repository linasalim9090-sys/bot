import { describe, expect, it } from 'vitest';
import { assertNoEmoji, containsEmoji, EmojiError } from '../../src/ui/emoji.js';

describe('emoji guard', () => {
  it('accepts plain Arabic and English text', () => {
    expect(containsEmoji('تم تنفيذ الأمر بنجاح')).toBe(false);
    expect(containsEmoji('Command completed')).toBe(false);
  });

  it('detects pictographs, flags, and keycaps', () => {
    expect(containsEmoji('مرحبا \u{1F600}')).toBe(true);
    expect(containsEmoji('\u{1F1F8}\u{1F1E6}')).toBe(true);
    expect(containsEmoji('1\uFE0F\u20E3')).toBe(true);
  });

  it('throws with a stable error type', () => {
    expect(() => assertNoEmoji('ok \u{1F600}')).toThrowError(EmojiError);
  });
});
