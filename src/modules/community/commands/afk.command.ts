import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('afk')
      .addStringOption((opt) =>
        opt.setName('reason').setDescription('AFK reason').setRequired(false),
      ),
    'commands.afk.description',
  ),
  meta: {
    module: 'community',
    cooldownMs: 3000,
    defer: 'ephemeral',
    usage: '/afk [reason]',
  },
  execute: async (ctx) => {
    const reason = ctx.interaction.options.getString('reason') ?? 'AFK';
    await ctx.interaction.editReply({
      content: ctx.t('commands.afk.success', { reason }),
    });
  },
});
