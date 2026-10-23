import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder().setName('dice'),
    'commands.dice.description',
  ),
  meta: {
    module: 'fun',
    cooldownMs: 2000,
    defer: false,
    usage: '/dice',
  },
  execute: async (ctx) => {
    const roll = Math.floor(Math.random() * 6) + 1;
    await ctx.interaction.reply({
      content: ctx.t('commands.dice.result', { result: roll }),
    });
  },
});
