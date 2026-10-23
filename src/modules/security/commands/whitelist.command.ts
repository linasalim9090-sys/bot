import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';
import { createEmbed } from '../../../ui/embeds.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('whitelist')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
      .addUserOption((opt) =>
        opt.setName('user').setDescription('Target user').setRequired(false),
      ),
    'commands.whitelist.description',
  ),
  meta: {
    module: 'security',
    permissions: ['Administrator'],
    cooldownMs: 3000,
    defer: 'ephemeral',
    usage: '/whitelist [user]',
  },
  execute: async (ctx) => {
    const user = ctx.interaction.options.getUser('user');

    if (user) {
      await ctx.auditService.record({
        guildId: ctx.settings.guildId,
        actorId: ctx.interaction.user.id,
        action: 'whitelist_add',
        targetId: user.id,
      });
      await ctx.interaction.editReply({
        content: `User ${user.tag ?? user.id} added to whitelist.`,
      });
      return;
    }

    const embed = createEmbed({
      title: ctx.t('commands.whitelist.title'),
      description: 'Security Whitelist Active',
      footer: { text: ctx.t('embeds.footer') },
    });
    await ctx.interaction.editReply({ embeds: [embed] });
  },
});
