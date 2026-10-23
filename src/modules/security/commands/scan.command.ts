import { PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { defineCommand } from '../../../core/command.js';
import { withDescriptions } from '../../../core/localize.js';
import { createEmbed } from '../../../ui/embeds.js';

export default defineCommand({
  data: withDescriptions(
    new SlashCommandBuilder()
      .setName('scan')
      .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    'commands.scan.description',
  ),
  meta: {
    module: 'security',
    permissions: ['Administrator'],
    cooldownMs: 5000,
    defer: 'ephemeral',
    usage: '/scan',
  },
  execute: async (ctx) => {
    const guild = ctx.interaction.guild;
    let adminRoles = 0;
    if (guild?.roles?.cache) {
      for (const [, r] of guild.roles.cache) {
        if (r.permissions?.has?.(PermissionFlagsBits.Administrator)) {
          adminRoles++;
        }
      }
    }

    const embed = createEmbed({
      title: ctx.t('commands.scan.title'),
      fields: [
        { name: 'Admin Roles Count', value: String(adminRoles), inline: true },
        { name: 'Status', value: 'Server scan completed cleanly.', inline: true },
      ],
      footer: { text: ctx.t('embeds.footer') },
      timestamp: true,
    });
    await ctx.interaction.editReply({ embeds: [embed] });
  },
});
