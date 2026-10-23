import type { LocalizationMap } from 'discord.js';
import { createTranslator } from '../i18n/index.js';

export interface DescribableBuilder {
  setDescription(description: string): this;
  setDescriptionLocalizations(localizedDescriptions: LocalizationMap | null): this;
}

export function withDescriptions<T extends DescribableBuilder>(
  builder: T,
  key: string,
): T {
  const ar = createTranslator('ar');
  const en = createTranslator('en');
  return builder
    .setDescription(ar(key))
    .setDescriptionLocalizations({ 'en-US': en(key) });
}
