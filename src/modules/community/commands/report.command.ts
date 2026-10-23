import { SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('report')
      .addUserOption((opt) =>
        opt.setName('user').setDescription('Target user').setRequired(true),
      )
      .addStringOption((opt) =>
        opt.setName('reason').setDescription('Report reason').setRequired(true),
      ),
    'commands.report.description',
  ),
  meta: {
    module: 'community',
    cooldownMs: 5000,
    defer: 'ephemeral',
    usage: '/report [user] [reason]',
  },
  execute: async (ctx) => {
    const targetUser = ctx.interaction.options.getUser('user', true);
    const reason = ctx.interaction.options.getString('reason', true);

    await ctx.auditService.record({
      guildId: ctx.settings.guildId,
      actorId: ctx.interaction.user.id,
      action: 'report',
      targetId: targetUser.id,
      metadataJson: { reason },
    });

    await ctx.interaction.editReply({
      content: ctx.t('commands.report.success'),
    });
  },
});
