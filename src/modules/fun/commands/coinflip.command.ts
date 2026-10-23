import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder().setName('coinflip'),
    'commands.coinflip.description',
  ),
  meta: {
    module: 'fun',
    cooldownMs: 2000,
    defer: false,
    usage: '/coinflip',
  },
  execute: async (ctx) => {
    const result = Math.random() < 0.5 ? 'Heads' : 'Tails';
    await ctx.interaction.reply({
      content: ctx.t('commands.coinflip.result', { result }),
    });
  },
});
