import { ButtonStyle, TextInputStyle } from 'discord.js';
import { describe, expect, it } from 'vitest';
import { createButton, createModal, createSelectMenu } from '../../src/ui/components.js';
import { createEmbed } from '../../src/ui/embeds.js';
import { LIMITS, truncate, UiLimitError } from '../../src/ui/limits.js';

describe('UI limits', () => {
  it('truncates to the exact maximum without exceeding it', () => {
    expect(truncate('abcdef', 4)).toHaveLength(4);
    expect(truncate('abc', 4)).toBe('abc');
    expect(truncate('abcdef', 2)).toHaveLength(2);
    expect(truncate('test', 0)).toBe('');
    expect(truncate('test', -1)).toBe('');
    expect(truncate('hello', 3)).toBe('hel');
  });

  it('caps embed description at 4096 characters', () => {
    const embed = createEmbed({ description: 'x'.repeat(5000) });
    expect(embed.data.description).toHaveLength(LIMITS.embedDescription);
  });

  it('rejects more than 25 embed fields', () => {
    const fields = Array.from({ length: 26 }, (_, index) => ({
      name: `f${index}`,
      value: 'v',
    }));
    expect(() => createEmbed({ fields })).toThrowError(UiLimitError);
  });

  it('rejects an embed whose total content exceeds 6000 characters', () => {
    const fields = Array.from({ length: 6 }, (_, index) => ({
      name: `f${index}`,
      value: 'x'.repeat(1024),
    }));
    expect(() => createEmbed({ fields })).toThrowError(UiLimitError);
  });

  it('rejects an overlong button label', () => {
    expect(() =>
      createButton({ customId: 'a', label: 'x'.repeat(81), style: ButtonStyle.Primary }),
    ).toThrowError(UiLimitError);
  });

  it('rejects an overlong custom id', () => {
    expect(() =>
      createButton({ customId: 'x'.repeat(101), label: 'ok', style: ButtonStyle.Primary }),
    ).toThrowError(UiLimitError);
  });

  it('rejects more than 25 select options and 5 modal inputs', () => {
    const options = Array.from({ length: 26 }, (_, index) => ({
      label: `o${index}`,
      value: `v${index}`,
    }));
    expect(() => createSelectMenu({ customId: 's', options })).toThrowError(UiLimitError);

    const inputs = Array.from({ length: 6 }, (_, index) => ({
      customId: `i${index}`,
      label: `l${index}`,
    }));
    expect(() => createModal({ customId: 'm', title: 't', inputs })).toThrowError(UiLimitError);
  });

  it('constructs buttons with valid options', () => {
    const btn = createButton({
      customId: 'btn1',
      label: 'Click me',
      style: ButtonStyle.Success,
      disabled: true,
    });
    expect(btn.data).toMatchObject({
      custom_id: 'btn1',
      label: 'Click me',
      disabled: true,
    });
  });

  it('constructs select menus with valid options and settings', () => {
    const select = createSelectMenu({
      customId: 'sel1',
      placeholder: 'Choose option',
      minValues: 1,
      maxValues: 2,
      disabled: false,
      options: [
        { label: 'Option 1', value: 'opt1', description: 'Desc 1', default: true },
        { label: 'Option 2', value: 'opt2' },
      ],
    });
    expect(select.data).toMatchObject({
      custom_id: 'sel1',
      placeholder: 'Choose option',
      min_values: 1,
      max_values: 2,
    });
  });

  it('constructs modals with inputs and various options', () => {
    const modal = createModal({
      customId: 'modal1',
      title: 'Feedback',
      inputs: [
        {
          customId: 'input1',
          label: 'Name',
          placeholder: 'Your name',
          value: 'Default',
          required: true,
          minLength: 2,
          maxLength: 30,
        },
        {
          customId: 'input2',
          label: 'Bio',
          style: TextInputStyle.Paragraph,
        },
      ],
    });
    expect(modal.data).toMatchObject({
      custom_id: 'modal1',
      title: 'Feedback',
    });
  });

  it('constructs embeds with rich options and metadata', () => {
    const now = new Date();
    const embed = createEmbed({
      title: 'Test Embed',
      description: 'Test description',
      url: 'https://example.com',
      color: 0x00ff00,
      author: { name: 'Author', iconURL: 'https://example.com/icon.png', url: 'https://example.com' },
      footer: { text: 'Footer', iconURL: 'https://example.com/foot.png' },
      thumbnail: 'https://example.com/thumb.png',
      image: 'https://example.com/img.png',
      timestamp: now,
      fields: [{ name: 'Field 1', value: 'Val 1', inline: true }],
    });
    expect(embed.data.title).toBe('Test Embed');
    expect(embed.data.url).toBe('https://example.com');
  });
});
