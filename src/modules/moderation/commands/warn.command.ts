import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('warn')
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
      .addUserOption((opt) =>
        opt.setName('user').setDescription('Target member to warn').setRequired(true),
      )
      .addStringOption((opt) =>
        opt.setName('reason').setDescription('Reason for warning').setRequired(false),
      ),
    'commands.warn.description',
  ),
  meta: {
    module: 'moderation',
    permissions: ['ModerateMembers'],
    cooldownMs: 3000,
    defer: 'ephemeral',
    usage: '/warn [user] [reason]',
  },
  execute: async (ctx) => {
    const targetUser = ctx.interaction.options.getUser('user', true);
    const reason = ctx.interaction.options.getString('reason') ?? 'No reason provided';

    await ctx.auditService.record({
      guildId: ctx.settings.guildId,
      actorId: ctx.interaction.user.id,
      action: 'warn',
      targetId: targetUser.id,
      metadataJson: { reason },
    });

    await ctx.interaction.editReply({
      content: ctx.t('commands.warn.success', { user: targetUser.tag ?? targetUser.id }),
    });
  },
});
