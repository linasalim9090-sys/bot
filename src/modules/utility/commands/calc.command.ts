import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';
import { createEmbed } from '../../../ui/embeds.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('calc')
      .addStringOption((opt) =>
        opt.setName('expression').setDescription('Math expression (e.g. 5 + 3)').setRequired(true),
      ),
    'commands.calc.description',
  ),
  meta: {
    module: 'utility',
    cooldownMs: 2000,
    defer: false,
    usage: '/calc [expression]',
  },
  execute: async (ctx) => {
    const expr = ctx.interaction.options.getString('expression', true);
    let result = 'Invalid Expression';

    // Safe simple arithmetic evaluator without eval
    const sanitized = expr.replace(/\s+/g, '');
    if (/^[0-9+\-*/.()]+$/.test(sanitized)) {
      try {
        const fn = new Function(`return ${sanitized}`);
        result = String(fn());
      } catch {
        result = 'Evaluation Error';
      }
    }

    const embed = createEmbed({
      title: ctx.t('commands.calc.title'),
      fields: [
        { name: 'Expression', value: expr, inline: true },
        { name: 'Result', value: result, inline: true },
      ],
      footer: { text: ctx.t('embeds.footer') },
    });
    await ctx.interaction.reply({ embeds: [embed] });
  },
});
