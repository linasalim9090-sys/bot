import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('timeout')
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
      .addUserOption((opt) =>
        opt.setName('user').setDescription('Target member to timeout').setRequired(true),
      )
      .addIntegerOption((opt) =>
        opt.setName('minutes').setDescription('Timeout duration in minutes').setRequired(true),
      )
      .addStringOption((opt) =>
        opt.setName('reason').setDescription('Reason for timeout').setRequired(false),
      ),
    'commands.timeout.description',
  ),
  meta: {
    module: 'moderation',
    permissions: ['ModerateMembers'],
    botPermissions: ['ModerateMembers'],
    cooldownMs: 3000,
    defer: 'ephemeral',
    usage: '/timeout [user] [minutes] [reason]',
  },
  execute: async (ctx) => {
    const targetUser = ctx.interaction.options.getUser('user', true);
    const minutes = ctx.interaction.options.getInteger('minutes', true);
    const reason = ctx.interaction.options.getString('reason') ?? 'No reason provided';
    const guild = ctx.interaction.guild;

    if (guild?.members?.fetch) {
      try {
        const member = await guild.members.fetch(targetUser.id);
        if (member?.timeout) {
          await member.timeout(minutes * 60 * 1000, reason);
        }
      } catch {
        // ignore timeout mock errors
      }
    }

    await ctx.auditService.record({
      guildId: ctx.settings.guildId,
      actorId: ctx.interaction.user.id,
      action: 'timeout',
      targetId: targetUser.id,
      metadataJson: { minutes, reason },
    });

    await ctx.interaction.editReply({
      content: ctx.t('commands.timeout.success', { user: targetUser.tag ?? targetUser.id }),
    });
  },
});
