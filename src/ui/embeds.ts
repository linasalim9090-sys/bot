import { type ColorResolvable, EmbedBuilder } from 'discord.js';
import { assertNoEmoji } from './emoji.js';
import { LIMITS, truncate, UiLimitError } from './limits.js';

export interface BotEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface BotEmbedAuthor {
  name: string;
  iconURL?: string;
  url?: string;
}

export interface BotEmbedFooter {
  text: string;
  iconURL?: string;
}

export interface BotEmbedInput {
  title?: string;
  description?: string;
  url?: string;
  color?: ColorResolvable | number;
  fields?: BotEmbedField[];
  author?: BotEmbedAuthor;
  footer?: BotEmbedFooter;
  timestamp?: Date | number | boolean;
  thumbnail?: string;
  image?: string;
}

export function createEmbed(input: BotEmbedInput): EmbedBuilder {
  const embed = new EmbedBuilder();
  let totalLength = 0;

  if (input.fields && input.fields.length > LIMITS.embedFields) {
    throw new UiLimitError(`Embed cannot have more than ${LIMITS.embedFields} fields.`);
  }

  if (input.title) {
    if (process.env.NODE_ENV !== 'production') assertNoEmoji(input.title);
    const title = truncate(input.title, LIMITS.embedTitle);
    embed.setTitle(title);
    totalLength += title.length;
  }

  if (input.description) {
    if (process.env.NODE_ENV !== 'production') assertNoEmoji(input.description);
    const description = truncate(input.description, LIMITS.embedDescription);
    embed.setDescription(description);
    totalLength += description.length;
  }

  if (input.url) {
    embed.setURL(input.url);
  }

  if (input.color !== undefined) {
    embed.setColor(input.color);
  }

  if (input.author) {
    if (process.env.NODE_ENV !== 'production') assertNoEmoji(input.author.name);
    const authorName = truncate(input.author.name, LIMITS.embedAuthor);
    embed.setAuthor({
      name: authorName,
      iconURL: input.author.iconURL,
      url: input.author.url,
    });
    totalLength += authorName.length;
  }

  if (input.footer) {
    if (process.env.NODE_ENV !== 'production') assertNoEmoji(input.footer.text);
    const footerText = truncate(input.footer.text, LIMITS.embedFooter);
    embed.setFooter({
      text: footerText,
      iconURL: input.footer.iconURL,
    });
    totalLength += footerText.length;
  }

  if (input.fields) {
    for (const field of input.fields) {
      if (process.env.NODE_ENV !== 'production') {
        assertNoEmoji(field.name);
        assertNoEmoji(field.value);
      }
      const fieldName = truncate(field.name, LIMITS.fieldName);
      const fieldValue = truncate(field.value, LIMITS.fieldValue);
      embed.addFields({
        name: fieldName,
        value: fieldValue,
        inline: field.inline,
      });
      totalLength += fieldName.length + fieldValue.length;
    }
  }

  if (input.thumbnail) {
    embed.setThumbnail(input.thumbnail);
  }

  if (input.image) {
    embed.setImage(input.image);
  }

  if (input.timestamp) {
    if (typeof input.timestamp === 'boolean') {
      embed.setTimestamp();
    } else {
      embed.setTimestamp(input.timestamp);
    }
  }

  if (totalLength > LIMITS.embedTotal) {
    throw new UiLimitError(`Embed exceeds ${LIMITS.embedTotal} characters total.`);
  }

  return embed;
}
