import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('reverse')
      .addStringOption((opt) =>
        opt.setName('text').setDescription('Text to reverse').setRequired(true),
      ),
    'commands.reverse.description',
  ),
  meta: {
    module: 'fun',
    cooldownMs: 2000,
    defer: false,
    usage: '/reverse [text]',
  },
  execute: async (ctx) => {
    const text = ctx.interaction.options.getString('text', true);
    const reversed = text.split('').reverse().join('');

    await ctx.interaction.reply({
      content: ctx.t('commands.reverse.result', { text: reversed }),
    });
  },
});
