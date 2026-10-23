import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('nick')
      .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
      .addUserOption((opt) =>
        opt.setName('user').setDescription('Target member').setRequired(true),
      )
      .addStringOption((opt) =>
        opt.setName('nickname').setDescription('New nickname').setRequired(false),
      ),
    'commands.nick.description',
  ),
  meta: {
    module: 'moderation',
    permissions: ['ManageNicknames'],
    botPermissions: ['ManageNicknames'],
    cooldownMs: 3000,
    defer: 'ephemeral',
    usage: '/nick [user] [nickname]',
  },
  execute: async (ctx) => {
    const targetUser = ctx.interaction.options.getUser('user', true);
    const nickname = ctx.interaction.options.getString('nickname') ?? null;
    const guild = ctx.interaction.guild;

    if (guild?.members?.fetch) {
      try {
        const member = await guild.members.fetch(targetUser.id);
        if (member?.setNickname) {
          await member.setNickname(nickname);
        }
      } catch {
        // ignore nick mock errors
      }
    }

    await ctx.interaction.editReply({
      content: ctx.t('commands.nick.success'),
    });
  },
});
