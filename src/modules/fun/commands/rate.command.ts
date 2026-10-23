import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('rate')
      .addStringOption((opt) =>
        opt.setName('target').setDescription('Target to rate').setRequired(true),
      ),
    'commands.rate.description',
  ),
  meta: {
    module: 'fun',
    cooldownMs: 2000,
    defer: false,
    usage: '/rate [target]',
  },
  execute: async (ctx) => {
    const target = ctx.interaction.options.getString('target', true);
    const score = Math.floor(Math.random() * 101);

    await ctx.interaction.reply({
      content: ctx.t('commands.rate.result', { target, score }),
    });
  },
});
