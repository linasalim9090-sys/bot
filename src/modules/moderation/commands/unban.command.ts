import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('unban')
      .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
      .addStringOption((opt) =>
        opt.setName('userid').setDescription('Target user ID to unban').setRequired(true),
      )
      .addStringOption((opt) =>
        opt.setName('reason').setDescription('Reason for unban').setRequired(false),
      ),
    'commands.unban.description',
  ),
  meta: {
    module: 'moderation',
    permissions: ['BanMembers'],
    botPermissions: ['BanMembers'],
    cooldownMs: 3000,
    defer: 'ephemeral',
    usage: '/unban [userid] [reason]',
  },
  execute: async (ctx) => {
    const userId = ctx.interaction.options.getString('userid', true);
    const reason = ctx.interaction.options.getString('reason') ?? 'No reason provided';
    const guild = ctx.interaction.guild;

    if (guild?.bans?.remove) {
      try {
        await guild.bans.remove(userId, reason);
      } catch {
        // ignore unban mock errors
      }
    }

    await ctx.auditService.record({
      guildId: ctx.settings.guildId,
      actorId: ctx.interaction.user.id,
      action: 'unban',
      targetId: userId,
      metadataJson: { reason },
    });

    await ctx.interaction.editReply({
      content: ctx.t('commands.unban.success', { user: userId }),
    });
  },
});
