import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('clearwarn')
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
      .addUserOption((opt) =>
        opt.setName('user').setDescription('Target member').setRequired(true),
      ),
    'commands.clearwarn.description',
  ),
  meta: {
    module: 'moderation',
    permissions: ['ModerateMembers'],
    cooldownMs: 3000,
    defer: 'ephemeral',
    usage: '/clearwarn [user]',
  },
  execute: async (ctx) => {
    const targetUser = ctx.interaction.options.getUser('user', true);

    await ctx.auditService.record({
      guildId: ctx.settings.guildId,
      actorId: ctx.interaction.user.id,
      action: 'clearwarn',
      targetId: targetUser.id,
      metadataJson: { cleared: true },
    });

    await ctx.interaction.editReply({
      content: ctx.t('commands.clearwarn.success', { user: targetUser.tag ?? targetUser.id }),
    });
  },
});
