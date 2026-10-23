import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('randomnumber')
      .addIntegerOption((opt) =>
        opt.setName('min').setDescription('Minimum value').setRequired(false),
      )
      .addIntegerOption((opt) =>
        opt.setName('max').setDescription('Maximum value').setRequired(false),
      ),
    'commands.randomnumber.description',
  ),
  meta: {
    module: 'utility',
    cooldownMs: 2000,
    defer: false,
    usage: '/randomnumber [min] [max]',
  },
  execute: async (ctx) => {
    const min = ctx.interaction.options.getInteger('min') ?? 1;
    const max = ctx.interaction.options.getInteger('max') ?? 100;
    const low = Math.min(min, max);
    const high = Math.max(min, max);
    const result = Math.floor(Math.random() * (high - low + 1)) + low;

    await ctx.interaction.reply({
      content: ctx.t('commands.randomnumber.result', { number: result }),
    });
  },
});
