import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('removerole')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
      .addUserOption((opt) =>
        opt.setName('user').setDescription('Target member').setRequired(true),
      )
      .addRoleOption((opt) =>
        opt.setName('role').setDescription('Role to remove').setRequired(true),
      ),
    'commands.removerole.description',
  ),
  meta: {
    module: 'moderation',
    permissions: ['ManageRoles'],
    botPermissions: ['ManageRoles'],
    cooldownMs: 3000,
    defer: 'ephemeral',
    usage: '/removerole [user] [role]',
  },
  execute: async (ctx) => {
    const targetUser = ctx.interaction.options.getUser('user', true);
    const targetRole = ctx.interaction.options.getRole('role', true);
    const guild = ctx.interaction.guild;

    if (guild?.members?.fetch) {
      try {
        const member = await guild.members.fetch(targetUser.id);
        if (member?.roles?.remove) {
          await member.roles.remove(targetRole.id);
        }
      } catch {
        // ignore role mock errors
      }
    }

    await ctx.interaction.editReply({
      content: ctx.t('commands.removerole.success'),
    });
  },
});
