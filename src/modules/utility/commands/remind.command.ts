import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('remind')
      .addIntegerOption((opt) =>
        opt.setName('minutes').setDescription('Minutes until reminder').setRequired(true),
      )
      .addStringOption((opt) =>
        opt.setName('text').setDescription('Reminder message').setRequired(true),
      ),
    'commands.remind.description',
  ),
  meta: {
    module: 'utility',
    cooldownMs: 3000,
    defer: 'ephemeral',
    usage: '/remind [minutes] [text]',
  },
  execute: async (ctx) => {
    const minutes = ctx.interaction.options.getInteger('minutes', true);
    const text = ctx.interaction.options.getString('text', true);

    await ctx.interaction.editReply({
      content: `${ctx.t('commands.remind.success')} (${minutes}m: ${text})`,
    });
  },
});
