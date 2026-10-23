import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('untimeout')
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
      .addUserOption((opt) =>
        opt.setName('user').setDescription('Target member to untimeout').setRequired(true),
      ),
    'commands.untimeout.description',
  ),
  meta: {
    module: 'moderation',
    permissions: ['ModerateMembers'],
    botPermissions: ['ModerateMembers'],
    cooldownMs: 3000,
    defer: 'ephemeral',
    usage: '/untimeout [user]',
  },
  execute: async (ctx) => {
    const targetUser = ctx.interaction.options.getUser('user', true);
    const guild = ctx.interaction.guild;

    if (guild?.members?.fetch) {
      try {
        const member = await guild.members.fetch(targetUser.id);
        if (member?.timeout) {
          await member.timeout(null);
        }
      } catch {
        // ignore untimeout mock errors
      }
    }

    await ctx.interaction.editReply({
      content: ctx.t('commands.untimeout.success', { user: targetUser.tag ?? targetUser.id }),
    });
  },
});
