const EMOJI_PATTERN = /[\p{Extended_Pictographic}\p{Regional_Indicator}\uFE0F\u20E3]/u;

export class EmojiError extends Error {
  constructor(public readonly text: string) {
    super('Bot-authored text must not contain emoji');
    this.name = 'EmojiError';
  }
}

export function containsEmoji(text: string): boolean {
  return EMOJI_PATTERN.test(text);
}

export function assertNoEmoji(text: string): void {
  if (containsEmoji(text)) throw new EmojiError(text);
}
