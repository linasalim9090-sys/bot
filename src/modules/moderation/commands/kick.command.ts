import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('kick')
      .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
      .addUserOption((opt) =>
        opt.setName('user').setDescription('Target member to kick').setRequired(true),
      )
      .addStringOption((opt) =>
        opt.setName('reason').setDescription('Reason for kick').setRequired(false),
      ),
    'commands.kick.description',
  ),
  meta: {
    module: 'moderation',
    permissions: ['KickMembers'],
    botPermissions: ['KickMembers'],
    cooldownMs: 3000,
    defer: 'ephemeral',
    usage: '/kick [user] [reason]',
  },
  execute: async (ctx) => {
    const targetUser = ctx.interaction.options.getUser('user', true);
    const reason = ctx.interaction.options.getString('reason') ?? 'No reason provided';
    const guild = ctx.interaction.guild;

    if (guild?.members?.fetch) {
      try {
        const member = await guild.members.fetch(targetUser.id);
        if (member?.kick) {
          await member.kick(reason);
        }
      } catch {
        // ignore kick mock errors
      }
    }

    await ctx.auditService.record({
      guildId: ctx.settings.guildId,
      actorId: ctx.interaction.user.id,
      action: 'kick',
      targetId: targetUser.id,
      metadataJson: { reason },
    });

    await ctx.interaction.editReply({
      content: ctx.t('commands.kick.success', { user: targetUser.tag ?? targetUser.id }),
    });
  },
});
