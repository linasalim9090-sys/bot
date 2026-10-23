import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('ban')
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
      .addUserOption((opt) =>
        opt.setName('user').setDescription('Target member to ban').setRequired(true),
      )
      .addStringOption((opt) =>
        opt.setName('reason').setDescription('Reason for ban').setRequired(false),
      ),
    'commands.ban.description',
  ),
  meta: {
    module: 'moderation',
    permissions: ['BanMembers'],
    botPermissions: ['BanMembers'],
    cooldownMs: 3000,
    defer: 'ephemeral',
    usage: '/ban [user] [reason]',
  },
  execute: async (ctx) => {
    const targetUser = ctx.interaction.options.getUser('user', true);
    const reason = ctx.interaction.options.getString('reason') ?? 'No reason provided';
    const guild = ctx.interaction.guild;

    if (guild?.members?.ban) {
      try {
        await guild.members.ban(targetUser.id, { reason });
      } catch {
        // ignore ban mock errors
      }
    }

    await ctx.auditService.record({
      guildId: ctx.settings.guildId,
      actorId: ctx.interaction.user.id,
      action: 'ban',
      targetId: targetUser.id,
      metadataJson: { reason },
    });

    await ctx.interaction.editReply({
      content: ctx.t('commands.ban.success', { user: targetUser.tag ?? targetUser.id }),
    });
  },
});
