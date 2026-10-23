import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';
import { createEmbed } from '../../../ui/embeds.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('warnings')
      .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
      .addUserOption((opt) =>
        opt.setName('user').setDescription('Target member').setRequired(true),
      ),
    'commands.warnings.description',
  ),
  meta: {
    module: 'moderation',
    permissions: ['ModerateMembers'],
    cooldownMs: 3000,
    defer: 'ephemeral',
    usage: '/warnings [user]',
  },
  execute: async (ctx) => {
    const targetUser = ctx.interaction.options.getUser('user', true);
    const list = await ctx.auditService.list(ctx.settings.guildId, 50);
    const userWarns = list.filter((e) => e.action === 'warn' && e.targetId === targetUser.id);

    const embed = createEmbed({
      title: ctx.t('commands.warnings.title'),
      description: `Target: ${targetUser.tag ?? targetUser.id} | Total: ${userWarns.length}`,
      fields: userWarns.slice(0, 10).map((w, i) => ({
        name: `#${i + 1}`,
        value: typeof w.metadataJson?.reason === 'string' ? w.metadataJson.reason : 'Warning',
      })),
      footer: { text: ctx.t('embeds.footer') },
    });

    await ctx.interaction.editReply({ embeds: [embed] });
  },
});
